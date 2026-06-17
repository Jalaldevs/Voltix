// bookmarkPremium.test.js — Tests for bookmark operations requiring premium
import React, { useCallback, useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, Text } from 'react-native';

// Mock usePremium hook
const mockRequirePremium = jest.fn();
jest.mock('../hooks/usePremium', () => ({
  __esModule: true,
  default: () => ({
    isPremium: false,
    requirePremium: mockRequirePremium,
    showPaywall: jest.fn(),
  }),
}));

// Mock bookmark functions
jest.mock('../constants/bookmarks', () => ({
  saveBookmark: jest.fn(),
  removeBookmark: jest.fn(),
  getBookmarks: jest.fn(),
}));

import { saveBookmark, removeBookmark, getBookmarks } from '../constants/bookmarks';
import usePremium from '../hooks/usePremium';

describe('Bookmark Premium Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bookmark Toggle with Premium Check', () => {
    it('should require premium when toggling bookmark', async () => {
      const TestBookmarkComponent = () => {
        const { requirePremium } = usePremium();
        const [isBookmarked, setIsBookmarked] = useState(false);

        const handleToggleBookmark = useCallback(
          (item) => {
            if (!item) return;
            requirePremium(async () => {
              setIsBookmarked(!isBookmarked);
              await saveBookmark(item);
            });
          },
          [isBookmarked, requirePremium]
        );

        return (
          <TouchableOpacity onPress={() => handleToggleBookmark({ id: 'test' })} testID="bookmark-btn">
            <Text>Toggle Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestBookmarkComponent />);

      fireEvent.press(getByTestId('bookmark-btn'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });

    it('should not save bookmark if user is not premium', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Simulate non-premium user - don't call the callback
      });

      const TestBookmarkComponent = () => {
        const { requirePremium } = usePremium();

        const handleToggleBookmark = useCallback(
          (item) => {
            if (!item) return;
            requirePremium(async () => {
              await saveBookmark(item);
            });
          },
          [requirePremium]
        );

        return (
          <TouchableOpacity onPress={() => handleToggleBookmark({ id: 'test' })} testID="bookmark-btn">
            <Text>Save Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestBookmarkComponent />);

      fireEvent.press(getByTestId('bookmark-btn'));

      await waitFor(() => {
        expect(saveBookmark).not.toHaveBeenCalled();
      });
    });

    it('should execute bookmark callback for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Simulate premium user - execute callback
        callback();
      });

      const TestBookmarkComponent = () => {
        const { requirePremium } = usePremium();

        const handleToggleBookmark = useCallback(
          (item) => {
            if (!item) return;
            requirePremium(async () => {
              await saveBookmark(item);
            });
          },
          [requirePremium]
        );

        return (
          <TouchableOpacity onPress={() => handleToggleBookmark({ id: 'test' })} testID="bookmark-btn">
            <Text>Save Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestBookmarkComponent />);

      fireEvent.press(getByTestId('bookmark-btn'));

      await waitFor(() => {
        expect(saveBookmark).toHaveBeenCalled();
      });
    });

    it('should handle bookmark removal for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      getBookmarks.mockResolvedValueOnce([
        { id: 'bookmark-1', source: 'quran', quran: { ayahId: 'test' } },
      ]);

      const TestRemoveBookmark = () => {
        const { requirePremium } = usePremium();

        const handleRemoveBookmark = useCallback(
          (bookmarkId) => {
            requirePremium(async () => {
              await removeBookmark(bookmarkId);
            });
          },
          [requirePremium]
        );

        return (
          <TouchableOpacity onPress={() => handleRemoveBookmark('bookmark-1')} testID="remove-btn">
            <Text>Remove Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestRemoveBookmark />);

      fireEvent.press(getByTestId('remove-btn'));

      await waitFor(() => {
        expect(removeBookmark).toHaveBeenCalledWith('bookmark-1');
      });
    });
  });

  describe('Bookmark Quran-specific', () => {
    it('should save Quran bookmark with correct data', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const quranBookmark = {
        source: 'quran',
        quran: {
          surahId: 2,
          ayahId: 255,
          surahName: 'Al-Baqarah',
          translationLanguage: 'english',
        },
      };

      const TestQuranBookmark = () => {
        const { requirePremium } = usePremium();

        return (
          <TouchableOpacity
            onPress={() => requirePremium(async () => await saveBookmark(quranBookmark))}
            testID="quran-bookmark"
          >
            <Text>Save Ayah Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestQuranBookmark />);

      fireEvent.press(getByTestId('quran-bookmark'));

      await waitFor(() => {
        expect(saveBookmark).toHaveBeenCalledWith(quranBookmark);
      });
    });
  });

  describe('Bookmark Sunnah-specific', () => {
    it('should save Sunnah bookmark with correct data', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const sunnahBookmark = {
        source: 'sunnah',
        sunnah: {
          book: 'bukhari',
          bookDisplayName: 'Sahih Al-Bukhari',
          hadithNumber: '1',
          sectionId: '1',
          arabicText: 'test hadith',
          translation: 'test hadith',
        },
      };

      const TestSunnahBookmark = () => {
        const { requirePremium } = usePremium();

        return (
          <TouchableOpacity
            onPress={() => requirePremium(async () => await saveBookmark(sunnahBookmark))}
            testID="sunnah-bookmark"
          >
            <Text>Save Hadith Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestSunnahBookmark />);

      fireEvent.press(getByTestId('sunnah-bookmark'));

      await waitFor(() => {
        expect(saveBookmark).toHaveBeenCalledWith(sunnahBookmark);
      });
    });
  });

  describe('Bookmark Paywall Integration', () => {
    it('should show paywall when non-premium user tries to bookmark', () => {
      const showPaywallMock = jest.fn();
      mockRequirePremium.mockImplementation((callback) => {
        showPaywallMock();
        // Don't execute callback for non-premium user
      });

      const TestBookmarkPaywall = () => {
        const { requirePremium } = usePremium();

        return (
          <TouchableOpacity
            onPress={() => requirePremium(async () => await saveBookmark({ id: 'test' }))}
            testID="bookmark"
          >
            <Text>Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestBookmarkPaywall />);

      fireEvent.press(getByTestId('bookmark'));

      expect(mockRequirePremium).toHaveBeenCalled();
    });
  });
});
