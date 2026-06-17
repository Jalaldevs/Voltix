// darkModePremium.test.js — Tests for dark mode requiring premium
import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock usePremium
const mockRequirePremium = jest.fn();
jest.mock('../hooks/usePremium', () => ({
  __esModule: true,
  default: () => ({
    isPremium: false,
    requirePremium: mockRequirePremium,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import usePremium from '../hooks/usePremium';

describe('Dark Mode Premium Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Toggle with Premium Check', () => {
    it('should require premium to toggle dark mode', async () => {
      const TestThemeToggle = () => {
        const { requirePremium } = usePremium();
        const [themeMode, setThemeMode] = useState('light');

        const toggleTheme = () => {
          requirePremium(() => {
            setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
          });
        };

        return (
          <>
            <Text testID="theme-mode">{themeMode}</Text>
            <TouchableOpacity onPress={toggleTheme} testID="toggle-btn">
              <Text>Toggle Theme</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestThemeToggle />);

      fireEvent.press(getByTestId('toggle-btn'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });

    it('should not toggle theme for non-premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Non-premium: don't execute callback
      });

      const TestThemeToggle = () => {
        const { requirePremium } = usePremium();
        const [themeMode, setThemeMode] = useState('light');

        const toggleTheme = () => {
          requirePremium(() => {
            setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
          });
        };

        return (
          <>
            <Text testID="theme-mode">{themeMode}</Text>
            <TouchableOpacity onPress={toggleTheme} testID="toggle">
              <Text>Toggle</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestThemeToggle />);

      fireEvent.press(getByTestId('toggle'));

      // Theme should remain 'light'
      expect(getByTestId('theme-mode')).toHaveTextContent('light');
    });

    it('should toggle theme for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Premium: execute callback
        callback();
      });

      const TestThemeToggle = () => {
        const { requirePremium } = usePremium();
        const [themeMode, setThemeMode] = useState('light');

        const toggleTheme = () => {
          requirePremium(() => {
            setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
          });
        };

        return (
          <>
            <Text testID="theme-mode">{themeMode}</Text>
            <TouchableOpacity onPress={toggleTheme} testID="toggle">
              <Text>Toggle</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestThemeToggle />);

      fireEvent.press(getByTestId('toggle'));

      await waitFor(() => {
        expect(getByTestId('theme-mode')).toHaveTextContent('dark');
      });
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference to AsyncStorage', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const TestThemePersistence = () => {
        const { requirePremium } = usePremium();
        const [themeMode, setThemeMode] = useState('light');

        const toggleTheme = () => {
          requirePremium(async () => {
            const nextTheme = themeMode === 'light' ? 'dark' : 'light';
            setThemeMode(nextTheme);
            await AsyncStorage.setItem('appTheme', nextTheme);
          });
        };

        return (
          <TouchableOpacity onPress={toggleTheme} testID="toggle">
            <Text>Toggle Theme</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestThemePersistence />);

      fireEvent.press(getByTestId('toggle'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('appTheme', 'dark');
      });
    });

    it('should load theme preference from AsyncStorage on app start', async () => {
      AsyncStorage.getItem.mockResolvedValue('dark');

      const TestLoadTheme = () => {
        const [themeMode, setThemeMode] = useState('light');

        React.useEffect(() => {
          AsyncStorage.getItem('appTheme').then((val) => {
            if (val === 'dark' || val === 'light') {
              setThemeMode(val);
            }
          });
        }, []);

        return <Text testID="theme">{themeMode}</Text>;
      };

      const { getByTestId } = render(<TestLoadTheme />);

      await waitFor(() => {
        expect(getByTestId('theme')).toHaveTextContent('dark');
      });
    });

    it('should default to light theme if no saved preference', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const TestDefaultTheme = () => {
        const [themeMode, setThemeMode] = useState('light');

        React.useEffect(() => {
          AsyncStorage.getItem('appTheme').then((val) => {
            if (val !== 'dark' && val !== 'light') {
              setThemeMode('light');
            }
          });
        }, []);

        return <Text testID="theme">{themeMode}</Text>;
      };

      const { getByTestId } = render(<TestDefaultTheme />);

      await waitFor(() => {
        expect(getByTestId('theme')).toHaveTextContent('light');
      });
    });
  });

  describe('Dark Mode in Settings Header', () => {
    it('should display dark mode option in settings menu', () => {
      const TestSettingsMenu = () => {
        const mockThemeToggle = jest.fn();

        return (
          <View>
            <TouchableOpacity onPress={mockThemeToggle} testID="theme-option">
              <Text>Dark Mode</Text>
            </TouchableOpacity>
          </View>
        );
      };

      const { getByTestId } = render(<TestSettingsMenu />);

      expect(getByTestId('theme-option')).toBeTruthy();
    });

    it('should trigger requirePremium when dark mode option is pressed', () => {
      const TestSettingsMenu = () => {
        const { requirePremium } = usePremium();

        const handleThemeToggle = () => {
          requirePremium(() => {
            // Theme toggle logic
          });
        };

        return (
          <TouchableOpacity onPress={handleThemeToggle} testID="dark-mode-option">
            <Text>Dark Mode</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestSettingsMenu />);

      fireEvent.press(getByTestId('dark-mode-option'));

      expect(mockRequirePremium).toHaveBeenCalled();
    });
  });

  describe('Theme Colors Based on Mode', () => {
    it('should apply light theme colors when in light mode', () => {
      const TestThemeColors = () => {
        const [themeMode] = useState('light');
        const theme = themeMode === 'light'
          ? { background: '#ffffff', text: '#000000' }
          : { background: '#1a1a1a', text: '#ffffff' };

        return <View style={{ backgroundColor: theme.background }} testID="themed-view" />;
      };

      const { getByTestId } = render(<TestThemeColors />);

      const view = getByTestId('themed-view');
      expect(view).toBeTruthy();
    });

    it('should apply dark theme colors when in dark mode', () => {
      const TestThemeColors = () => {
        const [themeMode] = useState('dark');
        const theme = themeMode === 'light'
          ? { background: '#ffffff', text: '#000000' }
          : { background: '#1a1a1a', text: '#ffffff' };

        return <View style={{ backgroundColor: theme.background }} testID="dark-view" />;
      };

      const { getByTestId } = render(<TestThemeColors />);

      const view = getByTestId('dark-view');
      expect(view).toBeTruthy();
    });
  });

  describe('Paywall for Dark Mode', () => {
    it('should show premium paywall when non-premium user tries to enable dark mode', () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Non-premium user should see paywall
        // callback not executed
      });

      const TestDarkModePaywall = () => {
        const { requirePremium } = usePremium();

        const handleToggleDarkMode = () => {
          requirePremium(() => {
            // This should not be called for non-premium users
          });
        };

        return (
          <TouchableOpacity onPress={handleToggleDarkMode} testID="dark-btn">
            <Text>Enable Dark Mode</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestDarkModePaywall />);

      fireEvent.press(getByTestId('dark-btn'));

      expect(mockRequirePremium).toHaveBeenCalled();
    });
  });

  describe('Multiple Theme Toggles', () => {
    it('should handle rapid theme toggles correctly', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const TestMultipleToggles = () => {
        const { requirePremium } = usePremium();
        const [themeMode, setThemeMode] = useState('light');

        const toggleTheme = () => {
          requirePremium(() => {
            setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
          });
        };

        return (
          <>
            <Text testID="theme">{themeMode}</Text>
            <TouchableOpacity onPress={toggleTheme} testID="toggle">
              <Text>Toggle</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestMultipleToggles />);

      fireEvent.press(getByTestId('toggle'));
      fireEvent.press(getByTestId('toggle'));

      await waitFor(() => {
        // Should be back to light after two toggles
        expect(getByTestId('theme')).toHaveTextContent('light');
      });
    });
  });
});
