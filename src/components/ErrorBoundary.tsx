
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-zinc-950 p-8">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 mb-6">
            <Feather name="alert-triangle" size={48} color="#71717A" />
          </View>
          <Text className="text-2xl font-bold text-zinc-50 mb-4">
            Oops, something went wrong!
          </Text>
          <Text className="text-sm text-zinc-400 mb-8 text-center">
            Don't worry, we're on it. Please try again.
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-cyan-500"
            onPress={this.handleReset}
          >
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
