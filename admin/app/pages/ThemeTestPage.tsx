import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function ThemeTestPage() {
  const [progress, setProgress] = useState(60)
  const [sliderValue, setSliderValue] = useState([50])
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Theme Test Page</h1>
        <p className="text-muted-foreground">Visual inspection of mobile theme tokens</p>
      </div>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Color Tokens</CardTitle>
          <CardDescription>Primary, Secondary, Accent colors from mobile theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="h-20 bg-primary rounded-lg mb-2" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">#6366F1 (Indigo)</p>
            </div>
            <div>
              <div className="h-20 bg-secondary rounded-lg mb-2" />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">#8B5CF6 (Violet)</p>
            </div>
            <div>
              <div className="h-20 bg-accent rounded-lg mb-2" />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">#06B6D4 (Cyan)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
          <CardDescription>Success, Warning, Info, Destructive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="h-20 bg-success rounded-lg mb-2" />
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground">#22C55E</p>
            </div>
            <div>
              <div className="h-20 bg-warning rounded-lg mb-2" />
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-muted-foreground">#F59E0B</p>
            </div>
            <div>
              <div className="h-20 bg-info rounded-lg mb-2" />
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-muted-foreground">#3B82F6</p>
            </div>
            <div>
              <div className="h-20 bg-destructive rounded-lg mb-2" />
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">#EF4444</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Button variants with new theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Button</Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Badge variants with semantic colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Badge>Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Font family: Inter (from mobile)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1 - Inter Font</h1>
            <h2 className="text-3xl font-semibold">Heading 2 - Inter Font</h2>
            <h3 className="text-2xl font-medium">Heading 3 - Inter Font</h3>
            <p className="text-base">Body text - Inter Font. The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-muted-foreground">Small text - Inter Font. The quick brown fox jumps over the lazy dog.</p>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius Scale</CardTitle>
          <CardDescription>Mobile radius values: xs=4px, sm=6px, md=10px, lg=14px, xl=20px</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="h-20 bg-primary rounded-xs mb-2" />
              <p className="text-sm font-medium">XS (0.25rem)</p>
            </div>
            <div>
              <div className="h-20 bg-primary rounded-sm mb-2" />
              <p className="text-sm font-medium">SM (0.375rem)</p>
            </div>
            <div>
              <div className="h-20 bg-primary rounded-md mb-2" />
              <p className="text-sm font-medium">MD (0.625rem)</p>
            </div>
            <div>
              <div className="h-20 bg-primary rounded-lg mb-2" />
              <p className="text-sm font-medium">LG (0.875rem)</p>
            </div>
            <div>
              <div className="h-20 bg-primary rounded-xl mb-2" />
              <p className="text-sm font-medium">XL (1.25rem)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background & Surface Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Background & Surface Colors</CardTitle>
          <CardDescription>Background, Card, Muted colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="h-20 bg-background border rounded-lg mb-2" />
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-muted-foreground">#FAFAF9</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-20 bg-card border rounded-lg mb-2" />
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground">#FFFFFF</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-20 bg-muted rounded-lg mb-2" />
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">#F4F4F5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flat Design - No Shadows */}
      <Card>
        <CardHeader>
          <CardTitle>Flat Design</CardTitle>
          <CardDescription>No shadows, no gradients - separation by borders only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">Card with Border</p>
              <p className="text-sm text-muted-foreground">No shadow, only border for separation</p>
            </div>
            <div className="border rounded-lg p-4 bg-muted">
              <p className="font-medium mb-2">Muted Background</p>
              <p className="text-sm text-muted-foreground">Flat color, no gradient</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Components - Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Component</CardTitle>
          <CardDescription>User avatars with fallback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">PV</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      {/* Progress Component */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Component</CardTitle>
          <CardDescription>Progress bars for loading states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Progress: {progress}%</Label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                </div>
              </div>
              <Progress value={progress} />
            </div>
            <Progress value={33} />
            <Progress value={75} />
          </div>
        </CardContent>
      </Card>

      {/* Slider Component */}
      <Card>
        <CardHeader>
          <CardTitle>Slider Component</CardTitle>
          <CardDescription>Range input slider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Value: {sliderValue[0]}</Label>
              <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} className="mt-2" />
            </div>
            <Slider defaultValue={[25]} max={100} step={1} />
            <Slider defaultValue={[75]} max={100} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Tooltip Component */}
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>Tooltip Component</CardTitle>
            <CardDescription>Hover tooltips for additional context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>Primary with tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Helpful information here</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Sheet Component */}
      <Card>
        <CardHeader>
          <CardTitle>Sheet Component</CardTitle>
          <CardDescription>Slide-out panels from different sides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Right Sheet</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Sheet Title</SheetTitle>
                  <SheetDescription>This is a sheet that slides in from the right</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm">Sheet content goes here. No shadows, just borders for separation.</p>
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Left Sheet</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Left Sheet</SheetTitle>
                  <SheetDescription>Slides in from the left</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
          <CardDescription>Inputs, selects, switches, and checkboxes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="select">Select</Label>
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
            <div className="flex items-center space-x-2">
              <Switch id="switch" />
              <Label htmlFor="switch">Enable notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="checkbox" />
              <Label htmlFor="checkbox">Accept terms and conditions</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Component */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs Component</CardTitle>
          <CardDescription>Tabbed navigation (no shadows on active tabs)</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <p className="text-sm">Content for Tab 1. Notice the flat design with no shadows.</p>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <p className="text-sm">Content for Tab 2.</p>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <p className="text-sm">Content for Tab 3.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
