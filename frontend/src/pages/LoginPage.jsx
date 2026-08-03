import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    Link,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";

const PLEXUS_POINTS = [
    [40, 60], [120, 40], [220, 110], [90, 160], [300, 60], [260, 200],
    [60, 260], [180, 230], [340, 180], [380, 90], [140, 320], [320, 320],
    [20, 380], [250, 380], [400, 300], [370, 380], [10, 150],
];

const PLEXUS_LINES = [
    [0, 1], [1, 2], [0, 3], [2, 4], [2, 5], [3, 6], [3, 7], [5, 8], [4, 9],
    [6, 10], [7, 11], [8, 11], [10, 12], [11, 13], [9, 14], [1, 4], [11, 15],
    [16, 0], [16, 6],
];

function PlexusBackground() {
    return (
        <svg
            viewBox="0 0 420 420"
            preserveAspectRatio="xMidYMid slice"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
        >
            {PLEXUS_LINES.map(([a, b], i) => (
                <line
                    key={i}
                    x1={PLEXUS_POINTS[a][0]}
                    y1={PLEXUS_POINTS[a][1]}
                    x2={PLEXUS_POINTS[b][0]}
                    y2={PLEXUS_POINTS[b][1]}
                    stroke="#4CAF8F"
                    strokeWidth="0.6"
                />
            ))}
            {PLEXUS_POINTS.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.2} fill="#8FD9C4" />
            ))}
        </svg>
    );
}

function PineSkyline() {
    const heights = [18, 34, 22, 40, 28, 45, 20, 36, 24, 42, 18];
    return (
        <svg
            viewBox="0 0 400 90"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 110 }}
        >
            {heights.map((h, i) => {
                const x = (400 / heights.length) * i + 10;
                return (
                    <g key={i} opacity={0.5 + (i % 3) * 0.15}>
                        <polygon points={`${x},${90 - h} ${x - h * 0.4},90 ${x + h * 0.4},90`} fill="#08251c" />
                        <polygon
                            points={`${x},${90 - h * 0.65} ${x - h * 0.3},${90 - h * 0.15} ${x + h * 0.3},${90 - h * 0.15}`}
                            fill="#08251c"
                        />
                    </g>
                );
            })}
        </svg>
    );
}

function BrandMark() {
    return (
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="24" stroke="#ffffff" strokeOpacity="0.5" strokeDasharray="3 4" />
            <line x1="28" y1="12" x2="14" y2="34" stroke="#8FD9C4" strokeWidth="1.5" />
            <line x1="28" y1="12" x2="42" y2="34" stroke="#8FD9C4" strokeWidth="1.5" />
            <line x1="14" y1="34" x2="42" y2="34" stroke="#8FD9C4" strokeWidth="1.5" />
            <circle cx="28" cy="12" r="5" fill="#8FD9C4" />
            <circle cx="14" cy="34" r="5" fill="#4CAF8F" />
            <circle cx="42" cy="34" r="5" fill="#4CAF8F" />
        </svg>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const response = await axiosClient.post("/auth/login", formData);
            login(response.data.access_token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || "Credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <Box
                sx={{
                    display: { xs: "none", md: "flex" },
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "linear-gradient(160deg, #0F3D30 0%, #16513f 55%, #0a2a20 100%)",
                    color: "#fff",
                }}
            >
                <PlexusBackground />
                <Box
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        px: 4,
                        textAlign: "center",
                    }}
                >
                    <BrandMark />
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                        SiGAT
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{ letterSpacing: 3, color: "#8FD9C4", textTransform: "uppercase", fontSize: "0.8rem" }}
                    >
                        Sistema de Gestión de Activos Tecnológicos
                    </Typography>
                </Box>
                <PineSkyline />
            </Box>

            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "background.default",
                    px: 3,
                }}
            >
                <Box sx={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                            Bienvenido
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ingresa tus credenciales para continuar
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutlineIcon color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="Contraseña"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            fullWidth
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {error && <Alert severity="error">{error}</Alert>}

                        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                            {loading ? "Ingresando..." : "Iniciar sesión"}
                        </Button>

                        <Link
                            component="button"
                            type="button"
                            underline="hover"
                            sx={{ alignSelf: "center", color: "primary.main", fontSize: "0.875rem" }}
                        >
                            Olvidé mi contraseña
                        </Link>
                    </form>

                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                        SiGAT v1.0 - Forestal Leonera
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
