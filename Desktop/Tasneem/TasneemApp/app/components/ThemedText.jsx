import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import Colors from '.././constants/Colors'
import { useNavigationContext } from './NavigationContext'

const ThemedText = ({style, ...props}) => {
    const { colorScheme } = useNavigationContext()
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

    return (
        <Text 
        style={[{backgroundColor: theme.background}, style]}
        {...props}
        
        />

    )
}

export default ThemedText

const styles = StyleSheet.create({})