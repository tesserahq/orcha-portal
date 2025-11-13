/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DatetimePicker } from '@/components/misc/DatetimePicker'

interface IProps {
  callback: (payload: any) => void
}

export default function ConfigDateTime({ callback }: IProps) {
  const [operation, setOperation] = useState('getCurrentDate')
  const [value, setValue] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('days')
  const [formatStr, setFormatStr] = useState('yyyy-MM-dd HH:mm:ss')

  const buildPayload = () => {
    const basePayload: any = {
      operation,
      format: formatStr,
    }

    switch (operation) {
      case 'getCurrentDate':
        // Only operation and format needed
        return {
          operation: 'getCurrentDate',
          format: formatStr,
        }

      case 'addTime':
        return {
          operation: 'addTime',
          value: value || new Date().toISOString(),
          amount: Number(amount) || 0,
          unit,
          format: formatStr,
        }

      case 'subtractTime':
        return {
          operation: 'subtractTime',
          value: value || new Date().toISOString(),
          amount: Number(amount) || 0,
          unit,
          format: formatStr,
        }

      case 'formatDate':
        return {
          operation: 'formatDate',
          value: value || new Date().toISOString(),
          format: formatStr,
        }

      default:
        return basePayload
    }
  }

  useEffect(() => {
    const payload = buildPayload()
    callback(payload)
  }, [operation, value, amount, unit, formatStr])

  return (
    <div className="space-y-4">
      {/* Operation */}
      <div className="space-y-1">
        <Label>Operation</Label>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="getCurrentDate">Get Current Date</SelectItem>
            <SelectItem value="addTime">Add Time</SelectItem>
            <SelectItem value="subtractTime">Subtract Time</SelectItem>
            <SelectItem value="formatDate">Format Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Base Date */}
      {operation !== 'getCurrentDate' && (
        <div className="flex flex-col space-y-1">
          <Label>Base Date</Label>
          <DatetimePicker
            currentDate={value ? new Date(value) : new Date()}
            onChange={(date) => {
              // handleChange('value', date?.toISOString() ?? '')
              setValue(date?.toISOString() ?? '')
            }}
          />
        </div>
      )}

      {/* Amount + Unit */}
      {(operation === 'addTime' || operation === 'subtractTime') && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                // handleChange('amount', e.target.value)
                setAmount(e.target.value)
              }}
              placeholder="e.g. 3"
            />
          </div>

          <div className="space-y-1">
            <Label>Unit</Label>
            <Select
              value={unit}
              onValueChange={(value) => {
                // handleChange('unit', value)
                setUnit(value)
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Format */}
      <div className="space-y-1">
        <Label>Output Format</Label>
        <Input
          value={formatStr}
          onChange={(e) => {
            setFormatStr(e.target.value)
          }}
          placeholder="yyyy-MM-dd HH:mm:ss"
        />
        <p className="text-sm text-muted-foreground">
          Examples: <code>yyyy-MM-dd</code>, <code>dd/MM/yyyy HH:mm</code>,{' '}
          <code>HH:mm:ss</code>
        </p>
      </div>
    </div>
  )
}
