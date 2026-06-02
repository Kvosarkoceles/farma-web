import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main className={cn(
                "min-h-screen bg-transparent transition-all duration-300",
                isCollapsed ? "pl-20" : "pl-64"
            )}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
