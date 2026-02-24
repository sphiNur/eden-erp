import { mockTelegramEnv, retrieveLaunchParams } from '@telegram-apps/sdk-react';

// It is important, to mock the environment only in development mode. When building the application
// the process.env.NODE_ENV variable is replaced with the 'production' string.
if (import.meta.env.DEV) {
    let shouldMock: boolean;

    // Try to extract launch parameters to check if the environment is already
    // mocked or we are running the application in Telegram.
    try {
        retrieveLaunchParams();

        // If we're able to retrieve launch parameters, it means the environment
        // is already mocked or we're running the application in Telegram.
        shouldMock = false;
    } catch {
        shouldMock = true;
    }

    if (shouldMock) {
        const initDataRaw = new URLSearchParams([
            ['user', JSON.stringify({
                id: 99282332,
                first_name: 'Andrew',
                last_name: 'Rogozov',
                username: 'rogovoz',
                language_code: 'en',
                is_premium: true,
                allows_write_to_pm: true,
            })],
            ['hash', '89d6079ad6762351f35c6632cb2e8e9122220d91b4edc2144a24f066e6c64633'],
            ['auth_date', '1716922846'],
            ['start_param', 'debug'],
            ['chat_type', 'sender'],
            ['chat_instance', '8428209589180543339'],
        ]).toString();

        mockTelegramEnv({
            launchParams: new URLSearchParams([
                ['tgWebAppThemeParams', JSON.stringify({
                    accent_text_color: '#6ab0f3',
                    bg_color: '#17212b',
                    button_color: '#5288c1',
                    button_text_color: '#ffffff',
                    destructive_text_color: '#ec3942',
                    header_bg_color: '#17212b',
                    hint_color: '#708499',
                    link_color: '#6ab0f3',
                    secondary_bg_color: '#232e3c',
                    section_bg_color: '#17212b',
                    section_header_text_color: '#6ab0f3',
                    subtitle_text_color: '#708499',
                    text_color: '#f5f5f5',
                })],
                ['tgWebAppData', initDataRaw],
                ['tgWebAppPlatform', 'tdesktop'],
                ['tgWebAppStartParam', 'debug'],
                ['tgWebAppVersion', '7.0'],
            ]).toString(),
        });

        console.log(
            '⚠️ Mocking Telegram environment. Notice that you should only do it in development mode.'
            + ' As well, shouldMock variable should be set to true only if you are running the application'
            + ' outside Telegram.',
        );
    }
}
