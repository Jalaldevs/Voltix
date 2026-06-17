import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import Colors from '.././constants/Colors'
import { useNavigationContext } from './NavigationContext'

const ThemedView = ({style, ...props}) => {
    const { colorScheme } = useNavigationContext()
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

    return (
        <View 
        style={[{backgroundColor: theme.background}, style]}
        {...props}
        
        />

    )
}

export default ThemedView

const styles = StyleSheet.create({})