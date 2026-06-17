// usePremium.test.js — Tests for premium hook and paywall behavior
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PremiumProvider, USE_MOCK_PREMIUM, usePremium } from '../app/hooks/usePremium';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock GetStarted component
jest.mock('../app/components/GetStarted', () => {
  return function MockGetStarted({ onClose, onPressGetStarted }) {
    return (
      <View testID="mock-getstarted">
        <Text>Premium Paywall</Text>
        <TouchableOpacity onPress={onPressGetStarted}>
          <Text>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

const TestComponent = () => {
  const { isPremium, requirePremium, showPaywall, hidePaywall, toggleMockPremium, purchaseSubscription } = usePremium();
  
  return (
    <View>
      <Text testID="premium-status">Premium: {isPremium ? 'Yes' : 'No'}</Text>
      <TouchableOpacity onPress={toggleMockPremium} testID="toggle-premium">
        <Text>Toggle Premium</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => requirePremium(() => {})} testID="require-premium">
        <Text>Require Premium</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={showPaywall} testID="show-paywall">
        <Text>Show Paywall</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={hidePaywall} testID="hide-paywall">
        <Text>Hide Paywall</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={purchaseSubscription} testID="purchase">
        <Text>Purchase</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('usePremium Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
  });

  describe('Mock Premium State', () => {
    it('should initialize with free (non-premium) state', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No saved state

      const { getByTestId } = render(
        <PremiumProvider>
          <TestComponent />
        </PremiumProvider>
      );

      await waitFor(() => {
        expect(getByTestId('premium-status')).toHaveTextContent('Premium: No');
      });
    });

    it('should load saved premium state from AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('true'); // Saved as premium

      const { getByTestId } = render(
        <PremiumProvider>
          <TestComponent />
        </PremiumProvider>
      );

      await waitFor(() => {
        expect(getByTestId('premium-status')).toHaveTextContent('Premium: Yes');
      });
    });

    it('should toggle premium state', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { getByTestId } = render(
        <PremiumProvider>
          <TestComponent />
        </PremiumProvider>
      );

      const toggleButton = getByTestId('toggle-premium');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('premium-status')).toHaveTextContent('Premium: Yes');
      });

      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('premium-status')).toHaveTextContent('Premium: No');
      });
    });

    it('should persist premium state to AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { getByTestId } = render(
        <PremiumProvider>
          <TestComponent />
        </PremiumProvider>
      );

      const toggleButton = getByTestId('toggle-premium');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@mock_is_premium',
          'true'
        );
      });
    });
  });

  describe('requirePremium Callback', () => {
    it('should execute action immediately if premium', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('true'); // Premium user

      const mockAction = jest.fn();
      
      // We need a component that uses requirePremium
      const TestRequirePremium = () => {
        const { requirePremium } = usePremium();
        
        return (
          <TouchableOpacity
            onPress={() => requirePremium(mockAction)}
            testID="action-button"
          >
            <Text>Do Action</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(
        <PremiumProvider>
          <TestRequirePremium />
        </PremiumProvider>
      );

      const button = getByTestId('action-button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });
    });

    it('should show paywall and defer action if not premium', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // Free user

      const mockAction = jest.fn();

      const TestRequirePremium = () => {
        const { requirePremium } = usePremium();
        
        return (
          <TouchableOpacity
            onPress={() => requirePremium(mockAction)}
            testID="action-button"
          >
            <Text>Do Action</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = render(
        <PremiumProvider>
          <TestRequirePremium />
        </PremiumProvider>
      );

      const button = getByTestId('action-button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(getByText('Premium Paywall')).toBeTruthy();
        // Action should NOT be called yet
        expect(mockAction).not.toHaveBeenCalled();
      });
    });
  });

  describe('Paywall Management', () => {
    it('should show paywall when requirePremium called for non-premium user', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const TestShowPaywall = () => {
        const { requirePremium } = usePremium();
        
        return (
          <TouchableOpacity
            onPress={() => requirePremium(() => {})}
            testID="show-paywall-btn"
          >
            <Text>Show Paywall</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = render(
        <PremiumProvider>
          <TestShowPaywall />
        </PremiumProvider>
      );

      fireEvent.press(getByTestId('show-paywall-btn'));

      await waitFor(() => {
        expect(getByText('Premium Paywall')).toBeTruthy();
      });
    });

    it('should execute pending action after purchase', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const mockAction = jest.fn();

      const TestPurchaseFlow = () => {
        const { requirePremium, purchaseSubscription } = usePremium();
        
        return (
          <View>
            <TouchableOpacity
              onPress={() => requirePremium(mockAction)}
              testID="action-btn"
            >
              <Text>Do Action</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={purchaseSubscription} testID="purchase-btn">
              <Text>Purchase</Text>
            </TouchableOpacity>
          </View>
        );
      };

      const { getByTestId } = render(
        <PremiumProvider>
          <TestPurchaseFlow />
        </PremiumProvider>
      );

      // Trigger requirePremium (shows paywall, defers action)
      fireEvent.press(getByTestId('action-btn'));

      // Complete purchase
      fireEvent.press(getByTestId('purchase-btn'));

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });
    });
  });

  describe('Mock Premium Development Flag', () => {
    it('should show dev toggle when USE_MOCK_PREMIUM is true', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { getByText } = render(
        <PremiumProvider>
          <View />
        </PremiumProvider>
      );

      if (USE_MOCK_PREMIUM) {
        // Dev button should be visible
        await waitFor(() => {
          expect(getByText(/Dev IAP/)).toBeTruthy();
        });
      }
    });
  });
});
