// // app/login/page.tsx
// 'use client';
// import { signIn } from 'next-auth/react';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function LoginPage() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const router = useRouter();

//     const handleCredentialsSignIn = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         try {
//             const result = await signIn('credentials', {
//                 redirect: false,
//                 email,
//                 password,
//             });

//             if (result?.error) {
//                 setError('Invalid email or password.');
//             } else if (result?.ok) {
//                 // Usar router.push en lugar de window.location.href
//                 router.push('/dashboard');
//             }
//         } catch (error) {
//             setError('An unexpected error occurred. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex flex-col gap-4 items-center justify-center min-h-screen bg-gray-200">

            

//             <div className="p-8 bg-white rounded-lg shadow-md w-96">
//                 <h1 className="text-2xl font-bold mb-4 text-center">Agent Login</h1>
                
//                 {/* Botón de Google */}
//                 <button
//                     onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
//                     disabled={isLoading}
//                     className="w-full mb-4 py-2 px-4 border flex justify-center items-center gap-2 border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                     <img 
//                         className="w-6 h-6" 
//                         src="https://www.svgrepo.com/show/475656/google-color.svg" 
//                         loading="lazy" 
//                         alt="google logo" 
//                     />
//                     <span>Login with Google</span>
//                 </button>

//                 <div className="text-center text-gray-500 my-2">OR</div>

//                 {/* Formulario de Credenciales */}
//                 <form onSubmit={handleCredentialsSignIn}>
//                     <div className="mb-4">
//                         <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                             Email
//                         </label>
//                         <input
//                             id="email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             disabled={isLoading}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                             placeholder="Enter your email"
//                         />
//                     </div>

//                     <div className="mb-4">
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//                             Password
//                         </label>
//                         <input
//                             id="password"
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             disabled={isLoading}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                             placeholder="Enter your password"
//                         />
//                     </div>

//                     {error && (
//                         <p className="text-red-500 text-sm mt-2 mb-4">{error}</p>
//                     )}

//                     <button 
//                         type="submit" 
//                         disabled={isLoading}
//                         className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
//                     >
//                         {isLoading ? 'Signing in...' : 'Login with Email'}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }


// app/login/page.tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Invalid email or password.');
            } else if (result?.ok) {
                router.push('/dashboard');
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Service Bot</h2>
                    <p className="text-gray-600">Access your control panel</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
                                Agent Login
                            </h3>
                        </div>

                        {/* Google Login */}
                        <button
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <img 
                                className="w-5 h-5" 
                                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                loading="lazy" 
                                alt="Google logo" 
                            />
                            <span>Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">or continue with email</span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleCredentialsSignIn} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
                                    placeholder="agent@company.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
                                    placeholder="Enter your password"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Sign in to Dashboard'
                                )}
                            </button>
                        </form>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                Forgot your password?
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>Secure access to your customer service management platform</p>
                </div>
            </div>
        </div>
    );
}