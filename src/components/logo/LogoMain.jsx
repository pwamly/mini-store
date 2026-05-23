import { useTheme } from '@mui/material/styles';

// ==============================|| CUSTOM LOGO ||============================== //

export default function LogoMain() {
  const theme = useTheme();

  // Support both MUI v5 and v6
  const palette = theme.vars?.palette || theme.palette;

  return (
    <svg
      width="180"
      height="40"
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ================= ICON ================= */}

      {/* Background Circle */}
      <circle
        cx="20"
        cy="20"
        r="16"
        fill={palette.primary.main}
      />

      {/* Inner Shape */}
      <path
        d="M20 10L28 20L20 30L12 20L20 10Z"
        fill={palette.primary.contrastText}
      />

      {/* ================= BRAND NAME ================= */}

      <text
        x="50"
        y="26"
        fontSize="20"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill={palette.text.primary}
      >
        Pwamly Store
      </text>
    </svg>
  );
}