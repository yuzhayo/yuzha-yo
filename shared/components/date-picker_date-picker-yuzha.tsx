"use client"

import * as React from "react"
import { format, parse, isValid, addMonths, subMonths } from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@shared/lib/utils"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"

export interface DatePickerYuzhaProps {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  onApply?: (date: Date | undefined) => void
  onCancel?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []

  const startPadding = firstDay.getDay()
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }

  const endPadding = 6 - lastDay.getDay()
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}

function isSameDay(date1: Date | undefined, date2: Date): boolean {
  if (!date1) return false
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(new Date(), date)
}

export function DatePickerYuzha({
  value: controlledValue,
  defaultValue,
  onChange,
  onApply,
  onCancel,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerYuzhaProps) {
  const [open, setOpen] = React.useState(false)
  
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(
    controlledValue ?? defaultValue
  )
  
  const appliedValue = controlledValue !== undefined ? controlledValue : internalValue
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(appliedValue)
  const [inputValue, setInputValue] = React.useState("")
  const [displayMonth, setDisplayMonth] = React.useState<Date>(appliedValue || new Date())

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "MM / dd / yyyy"))
    } else {
      setInputValue("")
    }
  }, [selectedDate])

  React.useEffect(() => {
    if (open) {
      setSelectedDate(appliedValue)
      if (appliedValue) {
        setDisplayMonth(appliedValue)
      }
    }
  }, [open, appliedValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    const cleanVal = val.replace(/\s/g, "").replace(/\//g, "-")
    const parsed = parse(cleanVal, "MM-dd-yyyy", new Date())

    if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
      setSelectedDate(parsed)
      setDisplayMonth(parsed)
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    setSelectedDate(today)
    setDisplayMonth(today)
  }

  const handleCancel = () => {
    setSelectedDate(appliedValue)
    onCancel?.()
    setOpen(false)
  }

  const handleApply = () => {
    setInternalValue(selectedDate)
    onChange?.(selectedDate)
    onApply?.(selectedDate)
    setOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handlePrevMonth = () => {
    setDisplayMonth(subMonths(displayMonth, 1))
  }

  const handleNextMonth = () => {
    setDisplayMonth(addMonths(displayMonth, 1))
  }

  const days = getDaysInMonth(displayMonth.getFullYear(), displayMonth.getMonth())

  const displayText = appliedValue 
    ? format(appliedValue, "d MMM yyyy") 
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[160px] justify-start text-left font-normal gap-2",
            !appliedValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <div className="p-4 w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(displayMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMonth}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="MM / DD / YYYY"
              className="flex-1 h-9 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="shrink-0 h-9 px-3 text-sm font-normal"
            >
              Today
            </Button>
          </div>

          <div 
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            className="gap-0 mb-2"
          >
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground font-normal"
              >
                {day}
              </div>
            ))}
          </div>

          <div 
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            className="gap-0"
          >
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === displayMonth.getMonth()
              const isSelected = isSameDay(selectedDate, date)
              const isTodayDate = isToday(date)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    "h-8 w-full flex items-center justify-center text-sm relative transition-colors",
                    "hover:bg-accent rounded-full",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isSelected && "bg-purple-600 text-white hover:bg-purple-700 rounded-full",
                    isTodayDate && !isSelected && "font-semibold"
                  )}
                >
                  {date.getDate()}
                  {isTodayDate && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex justify-center gap-3 pt-4 mt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePickerYuzha
