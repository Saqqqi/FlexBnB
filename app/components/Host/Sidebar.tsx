"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  ChatBubbleLeftRightIcon, 
  ChartPieIcon,
  BuildingOfficeIcon,
  InboxIcon,
  UserIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onClose, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: ChartBarIcon,
      href: '/Host/Dashboard',
      exact: true
    },
    {
      title: 'Property Management',
      icon: BuildingOfficeIcon,
      section: 'properties',
      items: [
        { title: 'My Listings', href: '/Host/Properties' },
        { title: 'Add Property', href: '/Host/Properties/Add' },
        { title: 'Property Analytics', href: '/Host/Analytics' }
      ]
    },
    {
      title: 'Reservations',
      icon: InboxIcon,
      section: 'reservations',
      items: [
        { title: 'All Bookings', href: '/Host/Reservations' },
        { title: 'Pending Requests', href: '/Host/Reservations?status=pending' },
        { title: 'Booking History', href: '/Host/Reservations?status=completed' }
      ]
    },
    {
      title: 'Financial Reports',
      icon: CurrencyDollarIcon,
      section: 'finances',
      items: [
        { title: 'Earnings Overview', href: '/Host/Earnings' },
        { title: 'Payout History', href: '/Host/Earnings/Payouts' },
        { title: 'Financial Analytics', href: '/Host/Earnings/Analytics' }
      ]
    },
    {
      title: 'Guest Messages',
      icon: ChatBubbleLeftRightIcon,
      href: '/Host/Messages'
    },
    {
      title: 'Performance Analytics',
      icon: ChartPieIcon,
      href: '/Host/Analytics'
    }
  ];

  const isActiveLink = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed left-0 right-0 top-32 bottom-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-32 bottom-0 z-30 bg-white shadow-lg transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72' : 'w-16'}
        ${isOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <HomeIcon className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-800">FlexBNB Host</span>
              </div>
              
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              {/* Desktop toggle button */}
              <button
                onClick={onToggle}
                className="hidden lg:block p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={onToggle}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <HomeIcon className="h-8 w-8 text-blue-600" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item, index) => {
            if (item.section) {
              const isExpanded = expandedSections[item.section];
              const hasActiveChild = item.items?.some(child => isActiveLink(child.href));
              
              if (!isOpen) {
                // Collapsed state - show only icon
                return (
                  <div key={index} className="relative group">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-lg transition-colors cursor-pointer
                      ${hasActiveChild ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    `}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-16 top-0 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={index}>
                  <button
                    onClick={() => toggleSection(item.section)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors
                      ${hasActiveChild ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.title}
                    </div>
                    <ChevronDownIcon 
                      className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.items?.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          onClick={onClose}
                          className={`
                            block px-4 py-2 text-sm rounded-md transition-colors
                            ${isActiveLink(subItem.href) 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (!isOpen) {
              // Collapsed state - show only icon
              return (
                <div key={index} className="relative group">
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-lg transition-colors
                      ${isActiveLink(item.href!, item.exact) 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="h-6 w-6" />
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute left-16 top-0 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.title}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={index}
                href={item.href!}
                onClick={onClose}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActiveLink(item.href!, item.exact) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          {isOpen ? (
            <>
              <div className="text-xs text-gray-500 mb-2">HOST</div>
              <Link
                href="/Host/Profile"
                onClick={onClose}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActiveLink('/Host/Profile') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <UserIcon className="h-5 w-5 mr-3" />
                Profile
              </Link>
            </>
          ) : (
            <div className="relative group">
              <Link
                href="/Host/Profile"
                onClick={onClose}
                className={`
                  flex items-center justify-center w-12 h-12 rounded-lg transition-colors
                  ${isActiveLink('/Host/Profile') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <UserIcon className="h-6 w-6" />
              </Link>
              {/* Tooltip */}
              <div className="absolute left-16 top-0 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Profile
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 