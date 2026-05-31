import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Progress } from '../../components/ui/progress'
import { Slider } from '../../components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Switch } from '../../components/ui/switch'
import { Checkbox } from '../../components/ui/checkbox'
import { Label } from '../../components/ui/label'
import { Palette } from 'lucide-react'
import { useState } from 'react'

export function ThemeTestPage() {
  const [progress, setProgress] = useState(60)
  const [sliderValue, setSliderValue] = useState([50])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Palette className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Theme Test Page</h1>
          <p className="text-lg text-muted-foreground mt-2">Visual inspection of design system tokens</p>
        </div>
      </div>

      {/* Colors */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Color Tokens</CardTitle>
          <CardDescription className="text-base">Primary, Secondary, Accent colors</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="h-32 bg-primary rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Primary</p>
              <p className="text-sm text-muted-foreground">#6366F1 (Indigo)</p>
            </div>
            <div>
              <div className="h-32 bg-secondary rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Secondary</p>
              <p className="text-sm text-muted-foreground">#8B5CF6 (Violet)</p>
            </div>
            <div>
              <div className="h-32 bg-accent rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Accent</p>
              <p className="text-sm text-muted-foreground">#06B6D4 (Cyan)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Semantic Colors</CardTitle>
          <CardDescription className="text-base">Success, Warning, Info, Destructive</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="h-32 bg-success rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Success</p>
              <p className="text-sm text-muted-foreground">#22C55E</p>
            </div>
            <div>
              <div className="h-32 bg-warning rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Warning</p>
              <p className="text-sm text-muted-foreground">#F59E0B</p>
            </div>
            <div>
              <div className="h-32 bg-info rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Info</p>
              <p className="text-sm text-muted-foreground">#3B82F6</p>
            </div>
            <div>
              <div className="h-32 bg-destructive rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">Destructive</p>
              <p className="text-sm text-muted-foreground">#EF4444</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Buttons</CardTitle>
          <CardDescription className="text-base">Button variants with flat design</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="flex flex-wrap gap-4">
            <Button size="lg">Primary Button</Button>
            <Button size="lg" variant="secondary">Secondary Button</Button>
            <Button size="lg" variant="outline">Outline Button</Button>
            <Button size="lg" variant="ghost">Ghost Button</Button>
            <Button size="lg" variant="destructive">Destructive Button</Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Badges</CardTitle>
          <CardDescription className="text-base">Badge variants with semantic colors</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="flex flex-wrap gap-4">
            <Badge className="text-base px-4 py-2">Default Badge</Badge>
            <Badge className="text-base px-4 py-2" variant="secondary">Secondary Badge</Badge>
            <Badge className="text-base px-4 py-2" variant="outline">Outline Badge</Badge>
            <Badge className="text-base px-4 py-2" variant="destructive">Destructive Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Typography</CardTitle>
          <CardDescription className="text-base">Font family: Inter</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <h1 className="text-4xl font-bold">Heading 1 - Inter Font</h1>
          <h2 className="text-3xl font-semibold">Heading 2 - Inter Font</h2>
          <h3 className="text-2xl font-medium">Heading 3 - Inter Font</h3>
          <p className="text-base">Body text - Inter Font. The quick brown fox jumps over the lazy dog.</p>
          <p className="text-sm text-muted-foreground">Small text - Inter Font. The quick brown fox jumps over the lazy dog.</p>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Border Radius Scale</CardTitle>
          <CardDescription className="text-base">Rounded corners: xl (20px) and 2xl (24px)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-5 gap-6">
            <div>
              <div className="h-32 bg-primary rounded mb-3 border-2 border-border" />
              <p className="text-base font-bold">Default</p>
            </div>
            <div>
              <div className="h-32 bg-primary rounded-lg mb-3 border-2 border-border" />
              <p className="text-base font-bold">LG</p>
            </div>
            <div>
              <div className="h-32 bg-primary rounded-xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">XL</p>
            </div>
            <div>
              <div className="h-32 bg-primary rounded-2xl mb-3 border-2 border-border" />
              <p className="text-base font-bold">2XL</p>
            </div>
            <div>
              <div className="h-32 bg-primary rounded-full mb-3 border-2 border-border" />
              <p className="text-base font-bold">Full</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flat Design */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Flat Design Principle</CardTitle>
          <CardDescription className="text-base">No shadows, no gradients - separation by borders only</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-2 gap-6">
            <div className="border-2 border-border rounded-xl p-6">
              <p className="font-bold text-lg mb-2">Card with Border</p>
              <p className="text-base text-muted-foreground">No shadow, only border-2 for separation</p>
            </div>
            <div className="border-2 border-border rounded-xl p-6 bg-muted/30">
              <p className="font-bold text-lg mb-2">Muted Background</p>
              <p className="text-base text-muted-foreground">Flat color, no gradient</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Form Components</CardTitle>
          <CardDescription className="text-base">Large inputs (h-12), generous spacing</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-3">
            <Label htmlFor="select" className="text-base">Select</Label>
            <Select>
              <SelectTrigger id="select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-3">
            <Switch id="switch" />
            <Label htmlFor="switch" className="text-base">Enable notifications</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="checkbox" />
            <Label htmlFor="checkbox" className="text-base">Accept terms and conditions</Label>
          </div>
        </CardContent>
      </Card>

      {/* Progress & Slider */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Progress & Slider</CardTitle>
          <CardDescription className="text-base">Interactive components</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-base">Progress: {progress}%</Label>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
              </div>
            </div>
            <Progress value={progress} />
          </div>
          <div className="space-y-3">
            <Label className="text-base">Slider: {sliderValue[0]}</Label>
            <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="rounded-2xl border-2">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl">Tabs Component</CardTitle>
          <CardDescription className="text-base">Tabbed navigation with flat design</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Tabs defaultValue="tab1">
            <TabsList className="h-14">
              <TabsTrigger value="tab1" className="text-base">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2" className="text-base">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3" className="text-base">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-6">
              <p className="text-base">Content for Tab 1. Notice the flat design with no shadows.</p>
            </TabsContent>
            <TabsContent value="tab2" className="mt-6">
              <p className="text-base">Content for Tab 2.</p>
            </TabsContent>
            <TabsContent value="tab3" className="mt-6">
              <p className="text-base">Content for Tab 3.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
