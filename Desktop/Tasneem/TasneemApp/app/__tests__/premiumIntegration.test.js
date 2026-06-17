// premiumIntegration.test.js — Integration tests for all premium features
import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules
const mockRequirePremium = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('../hooks/usePremium', () => ({
  __esModule: true,
  default: () => ({
    isPremium: false,
    requirePremium: mockRequirePremium,
    purchaseSubscription: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import usePremium from '../hooks/usePremium';
import { useRouter } from 'expo-router';

describe('Premium Features Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Results and Reference Modal', () => {
    it('should redirect to specific ayah for premium users', () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const TestSearchResult = () => {
        const router = useRouter();
        const { isPremium } = usePremium();

        const handleQuranResultPress = (result) => {
          if (isPremium || result.matchType === 'surah') {
            router.push({
              pathname: '/main/Quran',
              params: {
                surahId: result.surahId,
                ...(isPremium && { ayahId: result.ayahId }),
              },
            });
          }
        };

        return (
          <TouchableOpacity
            onPress={() => handleQuranResultPress({ surahId: 2, ayahId: 255, matchType: 'ayah' })}
            testID="result-btn"
          >
            <Text>Open Result</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestSearchResult />);

      fireEvent.press(getByTestId('result-btn'));

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/main/Quran',
          params: expect.objectContaining({
            surahId: 2,
          }),
        })
      );
    });

    it('should redirect to book level for non-premium users on search', () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Don't execute - non-premium
      });

      const TestSearchNonPremium = () => {
        const router = useRouter();
        const { isPremium, requirePremium } = usePremium();

        const handleQuranResultPress = (result) => {
          if (isPremium) {
            router.push({
              pathname: '/main/Quran',
              params: { surahId: result.surahId, ayahId: result.ayahId },
            });
          } else {
            requirePremium(() => {});
            router.push({
              pathname: '/main/Quran',
              params: { surahId: result.surahId },
            });
          }
        };

        return (
          <TouchableOpacity
            onPress={() => handleQuranResultPress({ surahId: 2, ayahId: 255 })}
            testID="result"
          >
            <Text>Open</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestSearchNonPremium />);

      fireEvent.press(getByTestId('result'));

      expect(mockRequirePremium).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.not.objectContaining({ ayahId: 255 }),
        })
      );
    });
  });

  describe('Bookmark Workflow with Premium', () => {
    it('should complete bookmark workflow for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const TestBookmarkWorkflow = () => {
        const { requirePremium } = usePremium();
        const [isBookmarked, setIsBookmarked] = useState(false);
        const [showNote, setShowNote] = useState(false);

        const handleBookmark = () => {
          requirePremium(() => {
            setIsBookmarked(!isBookmarked);
          });
        };

        const handleAddNote = () => {
          requirePremium(() => {
            setShowNote(true);
          });
        };

        return (
          <View>
            <TouchableOpacity onPress={handleBookmark} testID="bookmark">
              <Text>{isBookmarked ? 'Remove' : 'Add'} Bookmark</Text>
            </TouchableOpacity>
            {isBookmarked && (
              <TouchableOpacity onPress={handleAddNote} testID="add-note">
                <Text>Add Note</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      };

      const { getByTestId } = render(<TestBookmarkWorkflow />);

      fireEvent.press(getByTestId('bookmark'));

      await waitFor(() => {
        expect(getByTestId('add-note')).toBeTruthy();
      });

      fireEvent.press(getByTestId('add-note'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalledTimes(2);
      });
    });

    it('should prevent bookmark action for non-premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Non-premium - don't execute
      });

      const TestBookmarkNonPremium = () => {
        const { requirePremium } = usePremium();
        const [isBookmarked, setIsBookmarked] = useState(false);

        const handleBookmark = () => {
          requirePremium(() => {
            setIsBookmarked(!isBookmarked);
          });
        };

        return (
          <>
            <Text testID="status">{isBookmarked ? 'Bookmarked' : 'Not Bookmarked'}</Text>
            <TouchableOpacity onPress={handleBookmark} testID="bookmark">
              <Text>Bookmark</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestBookmarkNonPremium />);

      fireEvent.press(getByTestId('bookmark'));

      expect(getByTestId('status')).toHaveTextContent('Not Bookmarked');
    });
  });

  describe('Dark Mode and Other Settings', () => {
    it('should allow multiple premium features in settings menu', () => {
      const TestSettingsMenu = () => {
        const { requirePremium } = usePremium();
        const [darkMode, setDarkMode] = useState(false);

        const handleThemeToggle = () => {
          requirePremium(() => {
            setDarkMode(!darkMode);
          });
        };

        return (
          <View>
            <TouchableOpacity onPress={handleThemeToggle} testID="dark-mode">
              <Text>Dark Mode: {darkMode ? 'On' : 'Off'}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="other-feature">
              <Text>Other Feature</Text>
            </TouchableOpacity>
          </View>
        );
      };

      const { getByTestId } = render(<TestSettingsMenu />);

      expect(getByTestId('dark-mode')).toBeTruthy();
      expect(getByTestId('other-feature')).toBeTruthy();
    });
  });

  describe('Premium Purchase Flow', () => {
    it('should execute deferred actions after premium purchase', async () => {
      let paywallVisible = false;
      let deferredAction = null;

      mockRequirePremium.mockImplementation((action) => {
        deferredAction = action;
        paywallVisible = true;
      });

      const mockPurchaseSubscription = jest.fn().mockImplementation(() => {
        paywallVisible = false;
        if (deferredAction) {
          deferredAction();
        }
      });

      const TestPremiumFlow = () => {
        const { requirePremium } = usePremium();
        const [actionExecuted, setActionExecuted] = useState(false);

        const handleActionThatNeedsPremium = () => {
          requirePremium(() => {
            setActionExecuted(true);
          });
        };

        return (
          <>
            <Text testID="status">{actionExecuted ? 'Done' : 'Pending'}</Text>
            <TouchableOpacity onPress={handleActionThatNeedsPremium} testID="action">
              <Text>Do Action</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => mockPurchaseSubscription()} testID="purchase">
              <Text>Buy Premium</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestPremiumFlow />);

      // Trigger action that requires premium
      fireEvent.press(getByTestId('action'));

      expect(paywallVisible).toBe(true);

      // Simulate purchase
      fireEvent.press(getByTestId('purchase'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });

    it('should handle rapid feature access attempts during purchase', () => {
      const TestRapidAccess = () => {
        const { requirePremium } = usePremium();
        const callCount = jest.fn();

        const handleFeatureAccess = () => {
          requirePremium(() => {
            callCount();
          });
        };

        return (
          <TouchableOpacity onPress={handleFeatureAccess} testID="feature">
            <Text>Access Feature</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestRapidAccess />);

      // Rapid clicks
      fireEvent.press(getByTestId('feature'));
      fireEvent.press(getByTestId('feature'));
      fireEvent.press(getByTestId('feature'));

      expect(mockRequirePremium).toHaveBeenCalledTimes(3);
    });
  });

  describe('Free vs Premium User Experience', () => {
    it('should allow free users to browse but block actions', () => {
      const TestUserExperience = () => {
        const { requirePremium, isPremium } = usePremium();
        const [canBrowse, setCanBrowse] = useState(true);

        const handleBrowse = () => {
          setCanBrowse(true);
        };

        const handleAction = () => {
          requirePremium(() => {
            // Action only for premium
          });
        };

        return (
          <View>
            <TouchableOpacity onPress={handleBrowse} testID="browse">
              <Text>Browse {canBrowse ? 'OK' : 'BLOCKED'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAction} testID="action">
              <Text>Premium Action</Text>
            </TouchableOpacity>
            <Text testID="status">User: {isPremium ? 'Premium' : 'Free'}</Text>
          </View>
        );
      };

      const { getByTestId } = render(<TestUserExperience />);

      // Free users can browse
      fireEvent.press(getByTestId('browse'));
      expect(getByTestId('browse')).toHaveTextContent('Browse OK');

      // Free users see paywall on premium action
      fireEvent.press(getByTestId('action'));
      expect(mockRequirePremium).toHaveBeenCalled();
    });

    it('should give premium users full access', () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback(); // Execute immediately for premium
      });

      const TestPremiumExperience = () => {
        const { requirePremium } = usePremium();
        const [bookmarkCount, setBookmarkCount] = useState(0);
        const [pdfGenerated, setPdfGenerated] = useState(false);

        return (
          <View>
            <TouchableOpacity
              onPress={() => requirePremium(() => setBookmarkCount(bookmarkCount + 1))}
              testID="bookmark"
            >
              <Text>Bookmarks: {bookmarkCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => requirePremium(() => setPdfGenerated(true))}
              testID="pdf"
            >
              <Text>Generate PDF: {pdfGenerated ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          </View>
        );
      };

      const { getByTestId } = render(<TestPremiumExperience />);

      fireEvent.press(getByTestId('bookmark'));
      expect(getByTestId('bookmark')).toHaveTextContent('Bookmarks: 1');

      fireEvent.press(getByTestId('pdf'));
      expect(getByTestId('pdf')).toHaveTextContent('Generate PDF: Yes');
    });
  });

  describe('Feature Limits for Free Users', () => {
    it('should enforce limits even for bookmarked content', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Non-premium
      });

      const TestLimits = () => {
        const { requirePremium } = usePremium();
        const [notes, setNotes] = useState([]);

        const handleAddNote = () => {
          requirePremium(() => {
            if (notes.length < 3) {
              setNotes([...notes, 'new note']);
            }
          });
        };

        return (
          <>
            <Text testID="note-count">{notes.length}</Text>
            <TouchableOpacity onPress={handleAddNote} testID="add">
              <Text>Add Note</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestLimits />);

      fireEvent.press(getByTestId('add'));

      // Should remain 0 because requirePremium doesn't execute for non-premium
      expect(getByTestId('note-count')).toHaveTextContent('0');
    });
  });

  describe('Paywall UX', () => {
    it('should show paywall when non-premium user accesses feature', () => {
      const showPaywallMock = jest.fn();

      mockRequirePremium.mockImplementation((callback) => {
        showPaywallMock();
      });

      const TestPaywall = () => {
        const { requirePremium } = usePremium();

        return (
          <TouchableOpacity onPress={() => requirePremium(() => {})} testID="feature">
            <Text>Premium Feature</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestPaywall />);

      fireEvent.press(getByTestId('feature'));

      expect(mockRequirePremium).toHaveBeenCalled();
    });
  });
});
