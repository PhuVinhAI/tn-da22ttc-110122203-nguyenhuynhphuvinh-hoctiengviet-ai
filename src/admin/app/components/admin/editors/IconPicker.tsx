import {
  MessageSquare, Coffee, ShoppingCart, Plane, Building, Heart,
  Briefcase, Hospital, Utensils, Home, Map, GraduationCap,
  Music, Phone, Mail, Calendar, Clock, Sun, Cloud, Star,
  BookOpen, Users, User, Camera, Globe, Car, Train, Bike,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_PRESETS: Array<{ key: string; Icon: LucideIcon; label: string }> = [
  { key: 'message-square', Icon: MessageSquare, label: 'Hội thoại' },
  { key: 'coffee', Icon: Coffee, label: 'Cà phê' },
  { key: 'shopping-cart', Icon: ShoppingCart, label: 'Mua sắm' },
  { key: 'plane', Icon: Plane, label: 'Du lịch' },
  { key: 'building', Icon: Building, label: 'Công sở' },
  { key: 'heart', Icon: Heart, label: 'Cảm xúc' },
  { key: 'briefcase', Icon: Briefcase, label: 'Công việc' },
  { key: 'hospital', Icon: Hospital, label: 'Y tế' },
  { key: 'utensils', Icon: Utensils, label: 'Ẩm thực' },
  { key: 'home', Icon: Home, label: 'Gia đình' },
  { key: 'map', Icon: Map, label: 'Bản đồ' },
  { key: 'graduation-cap', Icon: GraduationCap, label: 'Học tập' },
  { key: 'music', Icon: Music, label: 'Âm nhạc' },
  { key: 'phone', Icon: Phone, label: 'Điện thoại' },
  { key: 'mail', Icon: Mail, label: 'Thư' },
  { key: 'calendar', Icon: Calendar, label: 'Lịch' },
  { key: 'clock', Icon: Clock, label: 'Thời gian' },
  { key: 'sun', Icon: Sun, label: 'Thời tiết' },
  { key: 'cloud', Icon: Cloud, label: 'Mây' },
  { key: 'star', Icon: Star, label: 'Yêu thích' },
  { key: 'book-open', Icon: BookOpen, label: 'Sách' },
  { key: 'users', Icon: Users, label: 'Nhóm' },
  { key: 'user', Icon: User, label: 'Cá nhân' },
  { key: 'camera', Icon: Camera, label: 'Camera' },
  { key: 'globe', Icon: Globe, label: 'Toàn cầu' },
  { key: 'car', Icon: Car, label: 'Xe hơi' },
  { key: 'train', Icon: Train, label: 'Tàu' },
  { key: 'bike', Icon: Bike, label: 'Xe đạp' },
]

export function getCategoryIcon(key: string | undefined | null): LucideIcon {
  return ICON_PRESETS.find((p) => p.key === key)?.Icon ?? MessageSquare
}

export function IconPicker({
  value,
  onChange,
  color = '#6366F1',
}: {
  value: string
  onChange: (next: string) => void
  color?: string
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5 rounded-lg border-2 border-border bg-muted/30 p-2">
      {ICON_PRESETS.map(({ key, Icon, label }) => {
        const isActive = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={label}
            className={`flex h-11 w-full items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'text-white'
                : 'border-2 border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary'
            }`}
            style={isActive ? { backgroundColor: color } : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )
      })}
    </div>
  )
}
