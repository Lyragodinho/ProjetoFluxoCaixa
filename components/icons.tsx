
import React from 'react';

export const IconBase: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">{children}</svg>
);

export const UploadIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></IconBase>;
export const DownloadIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></IconBase>;
export const PlusIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></IconBase>;
export const TrashIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></IconBase>;
export const DatabaseIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></IconBase>;
export const CheckCircleIcon: React.FC = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const CheckIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></IconBase>;
export const ErrorIcon: React.FC = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 13a1 1 0 112 0v-5a1 1 0 11-2 0v5zm2-8a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" /></svg>;

// New Icons for Home Page
export const HomeIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></IconBase>;
export const BanknotesIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h1.5m-1.5 0v.75m0 0v.75m0 0h1.5m0 0h.75m0 0h.75m0 0h.75m0 0h.75m-1.5 0h.75m1.5 0h.75M6 12v.75a.75.75 0 01-.75.75H5.25m0 0v-.75a.75.75 0 01.75-.75h.75m0 0h.75m2.25 0v.75a.75.75 0 01-.75.75H10.5m0 0v-.75a.75.75 0 01.75-.75h.75m0 0h.75m2.25 0v.75a.75.75 0 01-.75.75H15m0 0v-.75a.75.75 0 01.75-.75h.75m0 0h.75m2.25 0v.75a.75.75 0 01-.75.75H19.5m0 0v-.75a.75.75 0 01.75-.75h.75m0 0h.75M4.5 6v12m0 0a.75.75 0 01-.75.75H3.75m.75 0a.75.75 0 01.75.75V21m0 0a.75.75 0 01-.75.75H3.75m1.5-1.5H21m-16.5 0a.75.75 0 00-.75.75v.75m0 0a.75.75 0 00.75.75h.75m0 0H21m-16.5 0a.75.75 0 00-.75.75v.75m0 0a.75.75 0 00.75.75h.75m0 0H21" /></IconBase>;
export const ArrowUpCircleIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></IconBase>;
export const CheckBadgeIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></IconBase>;
export const TruckIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5h10.5a1.125 1.125 0 001.125-1.125V6.75a1.125 1.125 0 00-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5a1.125 1.125 0 001.125 1.125z" /></IconBase>;
export const ArrowDownCircleIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></IconBase>;
export const ExclamationTriangleIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></IconBase>;
export const ChartPieIcon: React.FC = () => <IconBase className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></IconBase>;

// Icons for Report drill-down
export const ChevronRightIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></IconBase>;
export const ChevronDownIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></IconBase>;
