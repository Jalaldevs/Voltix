import React from 'react';
import { Text } from 'react-native';

export default function ArabicTextWithFontForSharing({
    children,
    type = 'quran', // 'quran' | 'hadith'
    style,
    ...props
}) {
    return (
        <Text
            {...props}
            style={[
                {
                    fontFamily:
                        type === 'quran'
                            ? 'UthmanicHafs'
                            : 'KFGQPCUthmanTahaNaskh',
                },
                style,
            ]}
        >
            {children}
        </Text>
    );
}