import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

export const ProcessingOverview = () => {
    return (
      <Card className="md:col-span-5">
        <CardHeader>
          <CardTitle>Processing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                {["1.5M", "1.0M", "500K", "250K", "0"].map((value) => (
                  <div key={value} className="text-xs text-muted-foreground">
                    {value}
                  </div>
                ))}
              </div>
              <div className="flex-1 h-[250px] flex items-end justify-between px-2">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                  (month) => (
                    <div key={month} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-gray-900 dark:bg-gray-100"
                        style={{ height: `${Math.max(20, Math.floor(Math.random() * 200))}px` }}
                      ></div>
                      <div className="mt-2 text-xs">{month}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  