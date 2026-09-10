'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  PlusCircle, 
  FileSpreadsheet, 
  LogOut, 
  User, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 transition">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:inline">
                PrepKit<span className="text-sky-600 font-extrabold">.AI</span>
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-1 pl-6">
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/new"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/new')
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Kit</span>
                </Link>

                <Link
                  href="/bulk"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/bulk')
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Bulk Import</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Account / Auth Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-full text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium">{user.name || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-100"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center space-x-1 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-3.5 py-1.5 rounded-lg shadow-sm shadow-sky-500/20 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

