<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function registerSiswa(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'nis' => 'required|unique:siswa',
            'kelas' => 'required|string|max:50',
            'jurusan' => 'required|string|max:100',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:15',
            'recaptcha_token' => 'required'
        ]);


        DB::beginTransaction();

        $captchaVerify = Http::asForm()->post(
            'https://www.google.com/recaptcha/api/siteverify',
            [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->recaptcha_token,
                'remoteip' => $request->ip()
            ]
        );

        if (!($captchaVerify->json()['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Captcha tidak valid atau sudah expired.'
            ], 400);
        }

        try {
            // Create user
            $user = User::create([
                'name' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'siswa'
            ]);

            // Create siswa
            Siswa::create([
                'user_id' => $user->id,
                'nama' => $request->nama,
                'nis' => $request->nis,
                'kelas' => $request->kelas,
                'jurusan' => $request->jurusan,
                'alamat' => $request->alamat,
                'telepon' => $request->telepon
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registrasi siswa berhasil'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registrasi gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function registerGuru(Request $request)
    {

        $request->validate([
            'nip' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'alamat' => 'required',
            'telepon' => 'required|string|min:12',
        ]);

        DB::beginTransaction();

        try {
            // Create user
            $user = User::create([
                'name' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'guru'
            ]);

            // Create siswa
            Guru::create([
                'user_id' => $user->id,
                'nama' => $request->nama,
                'nip' => $request->nip,
                'alamat' => $request->alamat,
                'telepon' => $request->telepon
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registrasi admin berhasil'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registrasi gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        // Validasi input dasar
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
            'recaptcha_token' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // 🚀 Validasi reCAPTCHA ke Google
        $captchaVerify = Http::asForm()->post(
            'https://www.google.com/recaptcha/api/siteverify',
            [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->recaptcha_token,
                'remoteip' => $request->ip()
            ]
        );

        if (!($captchaVerify->json()['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Captcha tidak valid atau sudah expired.'
            ], 400);
        }

        // 🚀 Lanjut proses login
        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();

            // Generate token Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            $responseData = [
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role
                ],
                'token' => $token,
                'token_type' => 'Bearer'
            ];

            // Tambahan data relasi (opsional)
            if ($user->isSiswa() && $user->siswa) {
                $responseData['siswa'] = $user->siswa;
            } elseif ($user->isGuru() && $user->guru) {
                $responseData['guru'] = $user->guru;
            } elseif ($user->isDudi() && $user->dudi) {
                $responseData['dudi'] = $user->dudi;
            }

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil',
                'data' => $responseData
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Email atau password salah!'
        ], 401);
    }



    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            // Hapus token yang sedang digunakan
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user data
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ]
        ]);
    }
}
