import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '../constants/Colors';
import { useNavigationContext } from './NavigationContext';

const ThemedCard = ({ children, style, intensity = 25 }) => {
    const { colorScheme: scheme } = useNavigationContext();
    const theme = scheme === 'dark' ? Colors.dark : Colors.light;

    // Extract borderRadius and other visual styles from style prop
    const { borderRadius, paddingVertical, paddingHorizontal, padding, ...shadowStyles } = StyleSheet.flatten(style) || {};

    return (
        <View style={shadowStyles}>
            <View
                style={[
                    styles.wrapper,
                    {
                        backgroundColor: theme.cardFallback,
                        borderRadius,
                        paddingVertical,
                        paddingHorizontal,
                        padding,
                    },
                ]}
            >
                <BlurView
                    intensity={intensity}
                    tint={scheme}
                    style={StyleSheet.absoluteFill}
                />
                {children}
            </View>
        </View>
    );
};

export default ThemedCard;

const styles = StyleSheet.create({
    wrapper: {
        overflow: 'hidden',
    },
});