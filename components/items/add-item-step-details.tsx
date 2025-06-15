"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddItemStepDetailsProps {
  onNext: (data: any) => void
  onPrevious: () => void
  initialData?: any
}

export function AddItemStepDetails({ onNext, onPrevious, initialData }: AddItemStepDetailsProps) {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      color: initialData?.color || "",
      purity: initialData?.purity || "",
      stoneType: initialData?.stoneType || "",
      stoneWeight: initialData?.stoneWeight || "",
      manufacturer: initialData?.manufacturer || "",
      notes: initialData?.notes || "",
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qo'shimcha ma'lumotlar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="color">Rangi</Label>
              <Select value={initialData?.color || ""} onValueChange={(value) => setValue("color", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rangni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Sariq oltin</SelectItem>
                  <SelectItem value="white">Oq oltin</SelectItem>
                  <SelectItem value="rose">Pushti oltin</SelectItem>
                  <SelectItem value="silver">Kumush</SelectItem>
                  <SelectItem value="platinum">Platina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purity">Tozaligi</Label>
              <Select value={initialData?.purity || ""} onValueChange={(value) => setValue("purity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tozalikni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24k">24K</SelectItem>
                  <SelectItem value="22k">22K</SelectItem>
                  <SelectItem value="18k">18K</SelectItem>
                  <SelectItem value="14k">14K</SelectItem>
                  <SelectItem value="925">925 Kumush</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoneType">Tosh turi</Label>
              <Input id="stoneType" placeholder="masalan: Olmos, Yoqut, Zumrad" {...register("stoneType")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoneWeight">Tosh og'irligi (karat)</Label>
              <Input
                id="stoneWeight"
                type="number"
                step="0.01"
                placeholder="masalan: 0.50"
                {...register("stoneWeight")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Ishlab chiqaruvchi</Label>
              <Input id="manufacturer" placeholder="masalan: Vakil Gold Works" {...register("manufacturer")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Izohlar</Label>
            <Textarea
              id="notes"
              placeholder="Mahsulot haqida qo'shimcha ma'lumotlar..."
              rows={4}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Oldingi
            </Button>
            <Button type="submit">Keyingi: Ko'rib chiqish</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
