import React from 'react';
import { Feather } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = '#9CA3AF' }: IconProps) {
  return <Feather name={name as any} size={size} color={color} />;
}

export default Icon;
