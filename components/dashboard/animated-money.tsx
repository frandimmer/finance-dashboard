"use client"

import CountUp from "react-countup"

type Props = {
  value: number
  prefix?: string
}

export function AnimatedMoney({ value, prefix = "" }: Props) {
  return (
    <CountUp
      end={value}
      duration={0.6}
      separator="."
      decimals={2}
      decimal=","
      prefix={prefix}
    />
  )
}