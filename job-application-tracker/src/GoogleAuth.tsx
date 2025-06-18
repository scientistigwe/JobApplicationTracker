// GoogleAuth.tsx
import { useEffect } from "react";

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; // Replace with your OAuth 2.0 Client ID

export function GoogleAuthButton({
  onSuccess,
}: {
  onSuccess: (token: string) => void;
}) {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          onSuccess(response.credential);
        },
      });
      // @ts-ignore
      window.google.accounts.id.renderButton(
        document.getElementById("g-signin"),
        { theme: "outline", size: "large" }
      );
    };
    return () => {
      document.body.removeChild(script);
    };
  }, [onSuccess]);

  return <div id="g-signin"></div>;
}
