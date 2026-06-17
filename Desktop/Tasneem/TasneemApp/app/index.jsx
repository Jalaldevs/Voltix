import { Redirect } from "expo-router";
import { ActivityIndicator, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { isOnboardingCompleted } from './utils/offlineContent';

export default function Index() {
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadState = async () => {
            try {
                const done = await isOnboardingCompleted();
                if (mounted) {
                    setCompleted(done);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadState();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1976d2" />
            </View>
        );
    }

    return <Redirect href={completed ? "/main/Home" : "/onboarding"} />;
}