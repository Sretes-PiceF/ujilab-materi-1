<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class ItemController extends Controller
{
    /**
     * Get all items dengan cache
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 50);
        $status = $request->get('status');

        // Build cache key
        $cacheKey = "items:page:{$page}:limit:{$limit}:status:{$status}";

        // Try to get from cache (5 minutes)
        $items = Cache::remember($cacheKey, 300, function () use ($limit, $status) {
            $query = Item::query();

            if ($status) {
                $query->where('status', $status);
            }

            return $query->latest()
                ->paginate($limit)
                ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'source' => Cache::has($cacheKey) ? 'cache' : 'database',
        ]);
    }

    /**
     * Get single item
     */
    public function show($id)
    {
        $cacheKey = "item:{$id}";

        $item = Cache::remember($cacheKey, 300, function () use ($id) {
            return Item::findOrFail($id);
        });

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Create new item
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $item = Item::create($validator->validated());

        // Clear cache
        $this->clearItemsCache();

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item,
        ], 201);
    }

    /**
     * Update item
     */
    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $item->update($validator->validated());

        // Clear cache
        $this->clearItemsCache();
        Cache::forget("item:{$id}");

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item,
        ]);
    }

    /**
     * Delete item
     */
    public function destroy($id)
    {
        $item = Item::findOrFail($id);
        $item->delete();

        // Clear cache
        $this->clearItemsCache();
        Cache::forget("item:{$id}");

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully',
        ]);
    }

    /**
     * Clear all items cache
     */
    private function clearItemsCache()
    {
        // Clear all cache with pattern "items:*"
        $redis = Cache::getRedis();
        $keys = $redis->keys('laravel_database_items:*');

        foreach ($keys as $key) {
            Cache::forget(str_replace('laravel_database_', '', $key));
        }
    }

    /**
     * Manual cache clear endpoint
     */
    public function clearCache()
    {
        $this->clearItemsCache();

        return response()->json([
            'success' => true,
            'message' => 'Cache cleared successfully',
        ]);
    }
}
