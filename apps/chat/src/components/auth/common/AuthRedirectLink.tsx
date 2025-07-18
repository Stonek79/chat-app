'use client';

import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

interface AuthRedirectLinkProps {
    text: string;
    linkText: string;
    href: string;
}

export function AuthRedirectLink({ text, linkText, href }: AuthRedirectLinkProps) {
    return (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={NextLink} href={href} variant="body2" color="primary">
                {text} {linkText}
            </Link>
        </Box>
    );
}
