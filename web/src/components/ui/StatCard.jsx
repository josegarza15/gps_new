import React from 'react';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = 'primary', className }) => {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    const colorClasses = {
        primary: 'text-primary border-primary/30 bg-primary/5',
        success: 'text-success border-success/30 bg-success/5',
        warning: 'text-warning border-warning/30 bg-warning/5',
        destructive: 'text-destructive border-destructive/30 bg-destructive/5',
        accent: 'text-accent border-accent/30 bg-accent/5',
    };

    const iconColorClasses = {
        primary: 'text-primary',
        success: 'text-success',
        warning: 'text-warning',
        destructive: 'text-destructive',
        accent: 'text-accent',
    };

    return (
        <div className={clsx(
            "relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
            "shadow-[0_0_15px_rgba(0,0,0,0.3)]",
            colorClasses[color],
            className
        )}>
            {/* Architectural corner markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50"></div>

            <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider opacity-70">{title}</span>
                {Icon && <Icon size={16} className={clsx("opacity-80", iconColorClasses[color])} />}
            </div>

            <div className="flex items-end justify-between">
                <div className="text-2xl font-mono font-bold tracking-tight text-white text-glow">
                    {value}
                </div>

                {trendValue && (
                    <div className={clsx(
                        "flex items-center text-xs font-mono font-medium px-1.5 py-0.5 rounded",
                        isPositive && "text-emerald-400 bg-emerald-400/10",
                        isNegative && "text-rose-400 bg-rose-400/10",
                        !trend && "text-slate-400 bg-slate-400/10"
                    )}>
                        {isPositive && <ArrowUpRight size={12} className="mr-1" />}
                        {isNegative && <ArrowDownRight size={12} className="mr-1" />}
                        {!trend && <Activity size={12} className="mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>

            {/* Scanline effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[length:100%_200%] animate-scan"></div>
        </div>
    );
};

export default StatCard;
