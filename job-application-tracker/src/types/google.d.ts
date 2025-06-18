// Type definitions for Google Identity Service
interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  local?: string;
}

interface IdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback: (response: CredentialResponse) => void;
  login_uri?: string;
  native_callback?: Function;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  nonce?: string;
  context?: string;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: Function;
  itp_support?: boolean;
  scope?: string;
}

interface GsiButtonElement extends HTMLDivElement {
  // Add any custom properties here
}

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (idConfiguration: IdConfiguration) => void;
        prompt: (momentListener?: (promptMoment: any) => void) => void;
        renderButton: (
          parent: HTMLElement,
          options?: GsiButtonConfiguration
        ) => void;
        disableAutoSelect: () => void;
        storeCredential: (credential: { id: string; password: string }, callback?: Function) => void;
        cancel: () => void;
        onGoogleLibraryLoad: Function;
        revoke: (
          hint: string, 
          callback?: (done: { successful: boolean; error: string }) => void
        ) => void;
      };
    };
  };
}
