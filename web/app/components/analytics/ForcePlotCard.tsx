import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState, useEffect } from "react";
import { mlApi } from "~/services/api";
import { Activity, AlertCircle, Download, Loader2, Maximize2 } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface ForcePlotCardProps {
  employeeData: any;
  employeeId: number;
  employeeName: string;
}

export function ForcePlotCard({ employeeData, employeeId, employeeName }: ForcePlotCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forcePlot, setForcePlot] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadForcePlot();
  }, [employeeData]);

  const loadForcePlot = async () => {
    if (!employeeData) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await mlApi.getForcePlot(employeeData);
      setForcePlot(result.image);
      setPlotData(result);
    } catch (err) {
      setError("Failed to load force plot. Please try again.");
      console.error("Error loading force plot:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPlot = () => {
    if (!forcePlot) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${forcePlot}`;
    link.download = `force_plot_employee_${employeeId}_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              SHAP Force Plot Analysis
            </span>
            <div className="flex gap-2">
              {forcePlot && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadPlot}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadForcePlot}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Generating force plot...</p>
            </div>
          ) : forcePlot ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4 overflow-x-auto">
                <img 
                  src={`data:image/png;base64,${forcePlot}`} 
                  alt="SHAP Force Plot"
                  className="w-full h-auto min-w-[800px]"
                />
              </div>
              
              {plotData && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Base Value</div>
                    <div className="text-lg font-semibold text-blue-700">
                      {(plotData.base_value * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Average prediction across all employees
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Prediction</div>
                    <div className="text-lg font-semibold text-purple-700">
                      {(plotData.prediction * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Attrition probability for this employee
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-2">How to read this plot:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><span className="text-red-600 font-medium">Red bars</span> push the prediction higher (increase attrition risk)</li>
                  <li><span className="text-blue-600 font-medium">Blue bars</span> push the prediction lower (decrease attrition risk)</li>
                  <li>The plot starts at the base value and shows how each feature contributes to the final prediction</li>
                  <li>Longer bars indicate stronger feature impact on the prediction</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No force plot available</p>
              <Button onClick={loadForcePlot}>Generate Force Plot</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>
              SHAP Force Plot - {employeeName} (ID: {employeeId})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {forcePlot && (
              <img 
                src={`data:image/png;base64,${forcePlot}`} 
                alt="SHAP Force Plot"
                className="w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
