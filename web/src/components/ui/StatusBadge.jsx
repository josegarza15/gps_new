import React from 'react';
import clsx from 'clsx';

const StatusBadge = ({ status, className, pulse = false }) => {
    const getStatusStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'active':
            case 'online':
            case 'connected':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'inactive':
            case 'offline':
            case 'disconnected':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
            case 'warning':
            case 'alert':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'critical':
            case 'error':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            default:
                return 'bg-primary/10 text-primary border-primary/30';
        }
    };

    const getStatusDot = (s) => {
        switch (s?.toLowerCase()) {
            case 'active':
            case 'online':
            case 'connected':
                return 'bg-emerald-400 box-glow';
            case 'inactive':
            case 'offline':
            case 'disconnected':
                return 'bg-slate-400';
            case 'warning':
            case 'alert':
                return 'bg-amber-400 box-glow';
            case 'critical':
            case 'error':
                return 'bg-rose-400 box-glow';
            default:
                return 'bg-primary box-glow';
        }
    };

    return (
        <div className={clsx(
            "inline-flex items-center px-2 py-1 rounded border text-xs font-mono font-medium tracking-wide uppercase",
            getStatusStyle(status),
            className
        )}>
            <span className={clsx(
                "w-1.5 h-1.5 rounded-full mr-2",
                getStatusDot(status),
                pulse && "animate-pulse"
            )}></span>
            {status}
        </div>
    );
};

export default StatusBadge;
