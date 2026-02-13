import { useState, useRef, useEffect } from 'react';
import { Bug, User as UserIcon, Shield, ShoppingCart, Briefcase } from 'lucide-react';
import { Button } from './ui/button';
import { UserRole } from '../types';

export const DevTools = () => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Only show in development — must be AFTER hooks
    if (!import.meta.env.DEV) return null;

    const setRole = (role: UserRole) => {
        const mockUser = {
            id: '00000000-0000-4000-a000-000000000001',
            telegram_id: 123456789,
            username: `mock_${role}`,
            role: role
        };

        localStorage.setItem('dev_mock_user', JSON.stringify(mockUser));
        window.location.href = '/';
    };

    const clearMock = () => {
        localStorage.removeItem('dev_mock_user');
        window.location.href = '/';
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100"
            >
                <Bug size={18} className="text-gray-500" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-11 bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex flex-col gap-1 w-48 z-[1000] animate-in fade-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-gray-400 px-2 uppercase tracking-wider">Dev Tools</div>

                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => setRole('store_manager')}>
                        <UserIcon className="mr-2 h-4 w-4 text-blue-500" />
                        Manager
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => setRole('global_purchaser')}>
                        <ShoppingCart className="mr-2 h-4 w-4 text-green-500" />
                        Purchaser
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => setRole('admin')}>
                        <Shield className="mr-2 h-4 w-4 text-purple-500" />
                        Admin
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => setRole('finance')}>
                        <Briefcase className="mr-2 h-4 w-4 text-amber-500" />
                        Finance
                    </Button>
                    <div className="h-px bg-gray-100 my-1" />
                    <Button variant="ghost" size="sm" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearMock}>
                        Reset / Real API
                    </Button>
                </div>
            )}
        </div>
    );
};
