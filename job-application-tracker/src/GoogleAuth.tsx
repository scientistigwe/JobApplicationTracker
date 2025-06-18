// GoogleAuth.tsx
import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

// Get this from Google Cloud Console: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""; // Provided via environment variable

export function GoogleAuthButton({
  onSuccess,
}: {
  onSuccess: (token: string) => void;
}) {
  const googleSignInRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      try {
        if (!GOOGLE_CLIENT_ID) {
          setError("Google Client ID is not configured");
          setLoading(false);
          return;
        }

        // @ts-ignore - Using window.google which is loaded by the script
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            onSuccess(response.credential);
          },
          // Note: Scope for Google Identity Services is configured in Google Cloud Console
        });

        if (googleSignInRef.current) {
          // @ts-ignore - Using window.google which is loaded by the script
          window.google.accounts.id.renderButton(googleSignInRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "center",
            width: "280",
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Google Sign-In error:", err);
        setError("Failed to initialize Google Sign-In");
        setLoading(false);
      }
    };

    script.onerror = () => {
      setError("Failed to load Google Sign-In");
      setLoading(false);
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onSuccess]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Typography color="error" variant="body2" gutterBottom>
          {error}
        </Typography>
      ) : (
        <div ref={googleSignInRef} id="g-signin"></div>
      )}
    </Box>
  );
}
