import type { SVGAttributes } from 'react';

/** CRM mark: an open ring with a dot in the gap. Same shape as public/favicon.svg. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M23.07 8.93A10 10 0 1 0 23.07 23.07"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <circle cx="25.5" cy="16" r="2.5" />
        </svg>
    );
}
