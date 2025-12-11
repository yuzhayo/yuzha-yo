"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@shared/lib/utils"
import { Button } from "@shared/components/ui/button"
import { Calendar } from "@shared/components/ui/calendar"
import { Input } from "@shared/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"

export interface DatePickerYuzhaProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePickerYuzha({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerYuzhaProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState("")
  const [month, setMonth] = React.useState<Date>(value || new Date())

  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "MM / dd / yyyy"))
      setMonth(selectedDate)
    } else {
      setInputValue("")
    }
  }, [selectedDate])

  React.useEffect(() => {
    setSelectedDate(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    const cleanVal = val.replace(/\s/g, "").replace(/\//g, "-")
    const parsed = parse(cleanVal, "MM-dd-yyyy", new Date())
    
    if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
      setSelectedDate(parsed)
      setMonth(parsed)
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    setSelectedDate(today)
    setMonth(today)
  }

  const handleCancel = () => {
    setSelectedDate(value)
    setOpen(false)
  }

  const handleApply = () => {
    onChange?.(selectedDate)
    setOpen(false)
  }

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setMonth(date)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="MM / DD / YYYY"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="shrink-0"
            >
              Today
            </Button>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            initialFocus
          />
          
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-purple-600 hover:bg-purple-700 text-white">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePickerYuzha
