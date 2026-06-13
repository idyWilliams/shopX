import 'react-native-svg';

declare module 'lucide-react-native' {
  import { ComponentType } from 'react';
  import { SvgProps } from 'react-native-svg';

  interface LucideProps extends SvgProps {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export interface LucideIcon extends ComponentType<LucideProps> {}

  export const Home: LucideIcon;
  export const Package: LucideIcon;
  export const Activity: LucideIcon;
  export const Settings: LucideIcon;
  export const Camera: LucideIcon;
  export const Send: LucideIcon;
  export const X: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const MapPin: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Clock: LucideIcon;
  export const User: LucideIcon;
  export const Building2: LucideIcon;
  export const Bell: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const LogOut: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Image: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Check: LucideIcon;
  export const Search: LucideIcon;
}
