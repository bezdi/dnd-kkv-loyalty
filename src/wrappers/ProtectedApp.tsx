import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    Paper,
    TextField,
    Typography
} from '@mui/material';

const PASSWORD_HASH = 'cd534ae7941c8210cc2d90809457aa8594e57340a1b0e4644a1c699a9c0e203b'; // Replace with your SHA-256 hash

async function hashPassword(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ProtectedAppProps {
    children: React.ReactNode;
}

export default function ProtectedApp({ children }: ProtectedAppProps) {
    const [authenticated, setAuthenticated] = useState(false);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('authenticated');
        if (stored === 'true') setAuthenticated(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hash = await hashPassword(input);
        if (hash === PASSWORD_HASH) {
            sessionStorage.setItem('authenticated', 'true');
            setAuthenticated(true);
        } else {
            setError('Incorrect password.');
            setInput('');
        }
    };

    if (authenticated) return <>{children}</>;

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            bgcolor="#f5f5f5"
        >
            <Container maxWidth="xs">
                <Paper elevation={1} sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Typography variant="h6" mb={2}>Enter Password</Typography>
                        <TextField
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            fullWidth
                            autoFocus
                            margin="normal"
                            size="small"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Show password"
                        />
                        <Box mt={2}>
                            <Button type="submit" variant="contained" fullWidth>
                                Submit
                            </Button>
                        </Box>
                        {error && (
                            <Typography color="error" variant="body2" mt={2}>
                                {error}
                            </Typography>
                        )}
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}
