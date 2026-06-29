'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppDispatch } from '@/redux/hooks';
// Import the correct logout action (update the name if needed)
import { logout } from '@/redux/actions/action';
// If 'logoutAction' is correct, ensure it is exported from the module
 // ✅ Import typed dispatch


const TopBar: React.FC = () => {
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const router = useRouter();
  const dispatch = useAppDispatch(); // ✅ Typed for thunk support
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleProfileClick = (): void => {
    setDropdownOpen((prevState) => !prevState);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigate = (path: string): void => {
    setDropdownOpen(false);
    router.push(path);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/dashboard/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        dispatch(logout()); // ✅ Dispatch logout thunk
        router.push('/dashboard/login');
      } else {
        alert('Logout failed');
      }
    } catch {
      alert('Logout error');
    }
  };

  return (
    <header className="w-full bg-white shadow-lg py-2 px-8 flex justify-between items-center">
      {/* Search Bar */}
      <div className="w-full max-w-xs flex items-center gap-4 text-black">
        <Image
          src="/Logo-Main.png"
          alt="A Health Place Logo"
          width={130}
          height={40}
          priority
        />
        <input
          type="text"
          className="flex-1 pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 transition-all duration-300 ease-in-out hover:shadow-md"
          placeholder="Search blogs, posts..."
        />
      </div>

      {/* User Profile */}
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-end">
          <span
            className="text-lg font-semibold text-gray-800"
            style={{ fontFamily: 'poppins' }}
          >
            A Health Place
          </span>
          <span className="text-md text-gray-900 font-bold">
            Super Admin
          </span>
        </div>
        <div className="relative">
          <button
            className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 transition-all duration-300 ease-in-out"
            onClick={handleProfileClick}
          >
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              <Image
                src="/Logo-web.png"
                alt="Profile Image"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div ref={dropdownRef} className="relative">
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg py-2 z-50 ring-1 ring-black ring-opacity-5">
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => handleNavigate('/dashboard/profile')}
                >
                  My Profile
                </button>
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => handleNavigate('/dashboard/blog-table')}
                >
                  View Blog
                </button>
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => handleNavigate('/dashboard/settings')}
                >
                  Account Setting
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
