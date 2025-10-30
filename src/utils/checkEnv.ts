const checkEnvironment = () => {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(
      `%cMissing Environment Variables%c\n\n` +
      `The following required environment variables are missing:\n` +
      missing.map(key => `- ${key}`).join('\n') +
      `\n\nPlease add them to your .env file in the project root:`,
      'color: red; font-size: 1.2em; font-weight: bold;',
      'color: inherit;'
    );
    return false;
  }

  // Validate URL format
  try {
    new URL(required.VITE_SUPABASE_URL);
  } catch {
    console.error(
      `%cInvalid Supabase URL%c\n\n` +
      `VITE_SUPABASE_URL must be a valid URL (e.g., https://xxxxx.supabase.co)`,
      'color: red; font-size: 1.2em; font-weight: bold;',
      'color: inherit;'
    );
    return false;
  }

  // Validate anon key format
  if (!required.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    console.error(
      `%cInvalid Supabase Anon Key%c\n\n` +
      `VITE_SUPABASE_ANON_KEY should start with 'eyJ'`,
      'color: red; font-size: 1.2em; font-weight: bold;',
      'color: inherit;'
    );
    return false;
  }

  console.log(
    `%cEnvironment Check Passed%c\n\n` +
    `✓ VITE_SUPABASE_URL\n` +
    `✓ VITE_SUPABASE_ANON_KEY`,
    'color: green; font-size: 1.2em; font-weight: bold;',
    'color: inherit;'
  );
  return true;
};

export default checkEnvironment;