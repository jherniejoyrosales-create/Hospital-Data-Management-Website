import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Hospital,
  HelpCircle,
  FileBarChart,
  Stethoscope,
  Package,
  Heart
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import HelpDialog from './HelpDialog';
import { toast } from 'sonner';
import azghLogo from '../../hospital-logo.png.jpg';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'ICD Codes', href: '/icd-codes', icon: FileBarChart },
    { name: 'Z Benefits', href: '/z-benefits', icon: Package },
    { name: 'Konsulta', href: '/konsulta-packages', icon: Stethoscope },
    { name: 'RVS Codes', href: '/rvs-codes', icon: Heart },
    { name: 'Audit Logs', href: '/audit', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-blue-950 border-b-4 border-slate-700 sticky top-0 z-30 shadow-lg print:hidden">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
                <img src={azghLogo} alt="AZGH Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white text-lg">A. ZARATE GENERAL HOSPITAL</h1>
                <p className="text-xs text-slate-300 italic">"The skill to heal, the spirit to serve"</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HelpDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/20 text-white">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-600 text-white text-xs font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-300 capitalize">{user.role}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`} variant="outline">
                      {user.role.toUpperCase()}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <nav className="px-4 lg:px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium
                    transition-all duration-150 whitespace-nowrap border-b-2
                    ${
                      isActive
                        ? 'text-white border-white bg-white/10'
                        : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}