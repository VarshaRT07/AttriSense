import {
  BarChart3,
  Bell,
  ChevronDown,
  DatabaseIcon,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  TrendingUp,
  User,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigation, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { employeeApi } from "~/services/api";
import type { Employee } from "~/lib/interface";

interface LayoutProps {
  children: React.ReactNode;
}

// Notification type
interface Notification {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isNavigating = navigation.state === "loading";

  // Sample notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "alert",
      title: "High Attrition Risk Alert",
      message: "5 employees in Sales department have high attrition risk scores (>0.7)",
      time: "5 minutes ago",
      read: false,
      link: "/analytics",
    },
    {
      id: "2",
      type: "warning",
      title: "Survey Response Needed",
      message: "15 employees haven't completed their quarterly pulse survey",
      time: "1 hour ago",
      read: false,
      link: "/data-management",
    },
    {
      id: "3",
      type: "success",
      title: "Report Generated",
      message: "Q4 Attrition Analysis Report is ready for download",
      time: "2 hours ago",
      read: false,
      link: "/reports",
    },
    {
      id: "4",
      type: "info",
      title: "New Employee Added",
      message: "John Smith (ID: EMP-1234) has been added to the system",
      time: "3 hours ago",
      read: true,
      link: "/employees/EMP-1234",
    },
    {
      id: "5",
      type: "warning",
      title: "Department Risk Increase",
      message: "Engineering department's average risk score increased by 12% this month",
      time: "5 hours ago",
      read: true,
      link: "/analytics",
    },
  ]);

  const navigation_items = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Data Management", href: "/data-management", icon: DatabaseIcon },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Perform search
  const performSearch = async (query: string) => {
    setSearchLoading(true);
    try {
      const results = await employeeApi.search(query, 5);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search result click
  const handleResultClick = (employeeId: string | number) => {
    navigate(`/employees/${employeeId}`);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  // Get risk badge color
  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 0.7) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    if (riskScore >= 0.4) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  };

  // Get risk label
  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 0.7) return "High Risk";
    if (riskScore >= 0.4) return "Medium Risk";
    return "Low Risk";
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get notification background color
  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return "bg-gray-50 dark:bg-gray-800/50";
    switch (type) {
      case "alert":
        return "bg-red-50 dark:bg-red-900/10";
      case "success":
        return "bg-green-50 dark:bg-green-900/10";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/10";
      default:
        return "bg-white dark:bg-gray-800";
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setNotificationsOpen(false);
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Loading Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-600 animate-pulse"></div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 ${sidebarOpen ? "w-64" : "w-16"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-[72px] px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center">
              <img
                src="/app/data/logo.png"
                alt="AttriSense Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img
                src="/app/data/logo.png"
                alt="AttriSense Logo"
                className="h-10 w-12 object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-3">
          <div className="space-y-1">
            {navigation_items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${sidebarOpen ? "mr-3" : "mx-auto"} ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300`}
      >
        {/* Top Header - Fixed */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-[72px] px-6 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AttriSense
                </h1>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-Powered Attrition Intelligence for Indian Workforce
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="pl-10 pr-10 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Employees ({searchResults.length})
                        </div>
                        {searchResults.map((employee) => (
                          <button
                            key={employee.employee_id}
                            onClick={() => handleResultClick(employee.employee_id)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {employee.full_name}
                                  </p>
                                  <Badge
                                    className={`text-xs px-2 py-0.5 ${getRiskBadgeColor(
                                      employee.attrition_score || 0
                                    )}`}
                                  >
                                    {getRiskLabel(employee.attrition_score || 0)}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {employee.employee_id}
                                  </p>
                                  {employee.department && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {employee.department}
                                      </p>
                                    </>
                                  )}
                                  {employee.job_role && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {employee.job_role}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : searchQuery.trim().length >= 2 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No employees found for "{searchQuery}"
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Try searching by name, ID, or department
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setNotificationsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 max-h-[32rem] overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Notifications
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No notifications
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${getNotificationBgColor(
                                notification.type,
                                notification.read
                              )}`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <p className={`text-sm font-medium ${
                                      notification.read
                                        ? "text-gray-700 dark:text-gray-300"
                                        : "text-gray-900 dark:text-white"
                                    }`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="flex-shrink-0 ml-2">
                                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                          <Link
                            to="/notifications"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline block text-center"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <Avatar>
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setProfileDropdownOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>AD</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Admin User
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              admin@company.com
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          View Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            // Add logout logic here
                            console.log('Logout clicked');
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
