import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useState, useEffect } from "react";
import { mlApi } from "~/services/api";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Info,
  TrendingUp,
  User,
  Briefcase,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Link } from "react-router";

interface ShapPlotProps {
  employeeId?: string;
  employeeData?: any;
  dataType?: "employee" | "survey";
}

interface PlotCache {
  image: string;
  timestamp: Date;
}

export function ShapPlots({ employeeId, employeeData, dataType = "employee" }: ShapPlotProps) {
  const [plotType, setPlotType] = useState("summary");
  const [feature, setFeature] = useState("");

  // Individual loading states for each plot type
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFeatureImportance, setLoadingFeatureImportance] = useState(false);
  const [loadingDependence, setLoadingDependence] = useState(false);
  const [loadingForce, setLoadingForce] = useState(false);
  const [loadingWaterfall, setLoadingWaterfall] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [summaryPlot, setSummaryPlot] = useState<PlotCache | null>(null);
  const [featureImportancePlot, setFeatureImportancePlot] = useState<PlotCache | null>(null);
  const [dependencePlot, setDependencePlot] = useState<PlotCache | null>(null);
  const [forcePlot, setForcePlot] = useState<PlotCache | null>(null);
  const [waterfallPlot, setWaterfallPlot] = useState<PlotCache | null>(null);

  const [predictionData, setPredictionData] = useState<{
    base_value: number;
    prediction: number;
  } | null>(null);

  const [features, setFeatures] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Feature display names mapping
  const [featureDisplayNames, setFeatureDisplayNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const featuresData = await mlApi.getFeatures();
        const featureList = dataType === "survey"
          ? featuresData.survey_features
          : featuresData.employee_features;
        const displayNames = dataType === "survey"
          ? featuresData.survey_display_names
          : featuresData.employee_display_names;

        setFeatures(featureList);

        // Create mapping of technical names to display names
        const mapping: Record<string, string> = {};
        featureList.forEach((feat: string, idx: number) => {
          mapping[feat] = displayNames?.[idx] || feat;
        });
        setFeatureDisplayNames(mapping);

        if (featureList.length > 0) {
          setFeature(featureList[0]);
        }
      } catch (err) {
        console.error("Error loading features:", err);
      }
    };
    loadFeatures();
  }, [dataType]);

  // Clear all plots when dataType changes, then reload the current plot
  useEffect(() => {
    setSummaryPlot(null);
    setFeatureImportancePlot(null);
    setDependencePlot(null);
    setForcePlot(null);
    setWaterfallPlot(null);
    setPredictionData(null);

    // Clear all loading states
    setLoadingSummary(false);
    setLoadingFeatureImportance(false);
    setLoadingDependence(false);
    setLoadingForce(false);
    setLoadingWaterfall(false);

    // Reload the current plot after clearing
    if (plotType === "summary") {
      loadSummaryPlot();
    } else if (plotType === "feature_importance") {
      loadFeatureImportance();
    } else if (plotType === "dependence" && feature) {
      loadDependencePlot(feature);
    }
  }, [dataType]);

  // Load plots when plotType changes (but not on dataType change, handled above)
  useEffect(() => {
    if (plotType === "summary" && !summaryPlot) {
      loadSummaryPlot();
    }
  }, [plotType]);

  useEffect(() => {
    if (plotType === "feature_importance" && !featureImportancePlot) {
      loadFeatureImportance();
    }
  }, [plotType]);

  // Auto-refresh dependence plot when feature changes
  useEffect(() => {
    if (plotType === "dependence" && feature) {
      // Clear previous plot before loading new one
      setDependencePlot(null);
      setLoadingDependence(true);

      // Debounce to avoid rapid API calls
      const timer = setTimeout(() => {
        loadDependencePlot(feature);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [plotType, feature, dataType]);

  // Clear employee-specific plots when employee changes
  useEffect(() => {
    if (employeeId) {
      setForcePlot(null);
      setWaterfallPlot(null);
      setPredictionData(null);
      setLoadingForce(false);
      setLoadingWaterfall(false);
    }
  }, [employeeId]);

  useEffect(() => {
    console.log("[Force Plot useEffect]", { plotType, hasEmployeeData: !!employeeData, employeeId, dataType });
    if (plotType === "force" && employeeData) {
      console.log("[Force Plot] Loading with data:", employeeData);
      setForcePlot(null);
      setPredictionData(null);
      loadForcePlot();
    }
  }, [plotType, employeeData, employeeId, dataType]);

  useEffect(() => {
    console.log("[Waterfall Plot useEffect]", { plotType, hasEmployeeData: !!employeeData, employeeId, dataType });
    if (plotType === "waterfall" && employeeData) {
      console.log("[Waterfall Plot] Loading with data:", employeeData);
      setWaterfallPlot(null);
      loadWaterfallPlot();
    }
  }, [plotType, employeeData, employeeId, dataType]);

  const loadSummaryPlot = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const result =
        dataType === "survey"
          ? await mlApi.getSurveySummary()
          : await mlApi.getShapSummary();
      setSummaryPlot({ image: result.image, timestamp: new Date() });
    } catch (err) {
      setError("Failed to load summary plot. Please try again.");
      console.error("Error loading summary plot:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadFeatureImportance = async () => {
    setLoadingFeatureImportance(true);
    setError(null);
    try {
      const result = dataType === "survey"
        ? await mlApi.getSurveyFeatureImportance()
        : await mlApi.getFeatureImportance();
      setFeatureImportancePlot({ image: result.image, timestamp: new Date() });
    } catch (err) {
      setError("Failed to load feature importance plot. Please try again.");
      console.error("Error loading feature importance plot:", err);
    } finally {
      setLoadingFeatureImportance(false);
    }
  };

  const loadDependencePlot = async (selectedFeature: string) => {
    if (!selectedFeature) return;

    setLoadingDependence(true);
    setError(null);
    try {
      const result = dataType === "survey"
        ? await mlApi.getSurveyDependencePlot(selectedFeature)
        : await mlApi.getDependencePlot(selectedFeature);
      setDependencePlot({ image: result.image, timestamp: new Date() });
    } catch (err) {
      setError("Failed to load dependence plot. Please try again.");
      console.error("Error loading dependence plot:", err);
    } finally {
      setLoadingDependence(false);
    }
  };

  const loadForcePlot = async () => {
    if (!employeeData) return;

    setLoadingForce(true);
    setError(null);
    try {
      const result = dataType === "survey"
        ? await mlApi.getSurveyForcePlot(employeeData)
        : await mlApi.getForcePlot(employeeData);
      setForcePlot({ image: result.image, timestamp: new Date() });
      setPredictionData({
        base_value: result.base_value,
        prediction: result.prediction
      });
    } catch (err) {
      setError("Failed to load force plot. Please try again.");
      console.error("Error loading force plot:", err);
    } finally {
      setLoadingForce(false);
    }
  };

  const loadWaterfallPlot = async () => {
    if (!employeeData) return;

    setLoadingWaterfall(true);
    setError(null);
    try {
      const result = dataType === "survey"
        ? await mlApi.getSurveyWaterfallPlot(employeeData)
        : await mlApi.getWaterfallPlot(employeeData);
      setWaterfallPlot({ image: result.image, timestamp: new Date() });
    } catch (err) {
      setError("Failed to load waterfall plot. Please try again.");
      console.error("Error loading waterfall plot:", err);
    } finally {
      setLoadingWaterfall(false);
    }
  };

  const refreshCurrentPlot = () => {
    setError(null);
    switch (plotType) {
      case "summary":
        setSummaryPlot(null);
        loadSummaryPlot();
        break;
      case "feature_importance":
        setFeatureImportancePlot(null);
        loadFeatureImportance();
        break;
      case "dependence":
        setDependencePlot(null);
        loadDependencePlot(feature);
        break;
      case "force":
        setForcePlot(null);
        loadForcePlot();
        break;
      case "waterfall":
        setWaterfallPlot(null);
        loadWaterfallPlot();
        break;
    }
  };

  const downloadPlot = (plotCache: PlotCache | null, plotName: string) => {
    if (!plotCache) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${plotCache.image}`;
    link.download = `${plotName}_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };

  const getCurrentPlot = (): PlotCache | null => {
    switch (plotType) {
      case "summary": return summaryPlot;
      case "feature_importance": return featureImportancePlot;
      case "dependence": return dependencePlot;
      case "force": return forcePlot;
      case "waterfall": return waterfallPlot;
      default: return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper function to check if any plot is currently loading
  const isAnyPlotLoading = () => {
    return loadingSummary || loadingFeatureImportance || loadingDependence || loadingForce || loadingWaterfall;
  };

  const getRiskLevel = (prediction: number) => {
    if (prediction >= 0.7) return { level: "High", color: "bg-red-100 text-red-800 border-red-300" };
    if (prediction >= 0.4) return { level: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    return { level: "Low", color: "bg-green-100 text-green-800 border-green-300" };
  };

  const currentPlot = getCurrentPlot();

  return (
    <div className="space-y-4">
      {/* Context Card - Different for Employee vs Survey */}
      {employeeData && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            {dataType === "employee" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Employee</p>
                    <p className="font-semibold text-gray-900">{employeeData["Full Name"]}</p>
                    <p className="text-xs text-gray-500">ID: {employeeData["Employee ID"]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{employeeData["Department"]}</p>
                    <p className="text-xs text-gray-500">{employeeData["Job Role"]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Experience</p>
                    <p className="font-semibold text-gray-900">{employeeData["Years of experience"]} years</p>
                    <p className="text-xs text-gray-500">Tenure: {employeeData["YearsWithCompany"]} years</p>
                  </div>
                </div>

                {predictionData && (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      predictionData.prediction >= 0.7 ? 'bg-red-100' :
                      predictionData.prediction >= 0.4 ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      {predictionData.prediction >= 0.7 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : predictionData.prediction >= 0.4 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Attrition Risk</p>
                      <p className="font-semibold text-gray-900">{(predictionData.prediction * 100).toFixed(1)}%</p>
                      <Badge className={getRiskLevel(predictionData.prediction).color} variant="outline">
                        {getRiskLevel(predictionData.prediction).level} Risk
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Survey Data Context
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Employee ID</p>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        const empId = employeeData?.["Employee ID"] ||
                                     employeeData?.["employee_id"] ||
                                     employeeData?.employee_id;
                        return empId || "N/A";
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Survey Analysis</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Job Satisfaction</p>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        const jobSat = employeeData?.["Job Satisfaction"] ||
                                      employeeData?.["job_satisfaction"] ||
                                      employeeData?.job_satisfaction;
                        return jobSat ? `${jobSat}/5` : "N/A";
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Work-Life Balance</p>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        const wlb = employeeData?.["Work-Life Balance"] ||
                                   employeeData?.["work_life_balance"] ||
                                   employeeData?.work_life_balance;
                        return wlb ? `${wlb}/5` : "N/A";
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>

                {predictionData && (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      predictionData.prediction >= 0.7 ? 'bg-red-100' :
                      predictionData.prediction >= 0.4 ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      {predictionData.prediction >= 0.7 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : predictionData.prediction >= 0.4 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Attrition Risk</p>
                      <p className="font-semibold text-gray-900">{(predictionData.prediction * 100).toFixed(1)}%</p>
                      <Badge className={getRiskLevel(predictionData.prediction).color} variant="outline">
                        {getRiskLevel(predictionData.prediction).level} Risk
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>Risk Factor Analysis - {dataType === "survey" ? "Pulse Survey" : "Demographics & Job"}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowHelp(!showHelp)}
                title="Toggle help information"
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {currentPlot && (
                <span className="text-xs text-gray-500">
                  Updated: {formatTimestamp(currentPlot.timestamp)}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCurrentPlot}
                disabled={isAnyPlotLoading()}
                title="Refresh current plot"
              >
                <RefreshCw className={`h-4 w-4 ${isAnyPlotLoading() ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPlot(currentPlot, plotType)}
                disabled={!currentPlot}
                title="Download current plot"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showHelp && (
            <Alert className="mb-4 border-purple-200 bg-purple-50">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-900">💡 How to Read These Charts</h4>
                  <p className="text-sm text-purple-800">
                    SHAP (SHapley Additive exPlanations) values show how each feature contributes to the attrition risk prediction.
                  </p>
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Current plot: {plotType.replace('_', ' ').toUpperCase()}</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      {plotType === 'summary' && (
                        <>
                          <li>Features ordered by importance (top to bottom)</li>
                          <li>Violin shapes show the distribution of SHAP values</li>
                          <li>Red = high feature value, Blue = low feature value</li>
                          <li>Right side = increases risk, Left side = decreases risk</li>
                        </>
                      )}
                      {plotType === 'feature_importance' && (
                        <>
                          <li>Shows average absolute impact of each feature</li>
                          <li>Longer bars = more important features</li>
                          <li>Identifies key drivers of attrition</li>
                        </>
                      )}
                      {plotType === 'dependence' && (
                        <>
                          <li>Shows how a feature affects predictions</li>
                          <li>X-axis = feature value, Y-axis = SHAP value</li>
                          <li>Color shows interaction with other features</li>
                        </>
                      )}
                      {plotType === 'force' && (
                        <>
                          <li>Red bars increase attrition risk</li>
                          <li>Blue bars decrease attrition risk</li>
                          <li>Bar length shows impact strength</li>
                          <li>Top 15 most impactful features shown</li>
                        </>
                      )}
                      {plotType === 'waterfall' && (
                        <>
                          <li>Shows cumulative effect of features</li>
                          <li>Starts from base value (company average)</li>
                          <li>Each bar adds or subtracts from prediction</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCurrentPlot}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={plotType} onValueChange={setPlotType}>
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="summary">Overview</TabsTrigger>
              <TabsTrigger value="feature_importance">Key Factors</TabsTrigger>
              <TabsTrigger value="dependence">Factor Relationships</TabsTrigger>
              {employeeId && employeeData && (
                <>
                  <TabsTrigger value="force">Individual Impact</TabsTrigger>
                  <TabsTrigger value="waterfall">Cumulative Impact</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="summary" className="min-h-[500px]">
              {plotType === "summary" && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {loadingSummary ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <p className="text-sm text-gray-600">Loading overview...</p>
                    </div>
                  ) : summaryPlot ? (
                    <div className="w-full space-y-4">
                      <div className="bg-white rounded-lg border p-4">
                        <img
                          src={`data:image/png;base64,${summaryPlot.image}`}
                          alt="SHAP Summary Plot"
                          className="w-full h-auto"
                        />
                      </div>

                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                          <p className="font-medium mb-2">How to read this plot:</p>
                          <ul className="space-y-1 list-disc list-inside text-xs">
                            <li>Each row represents a feature (factor) affecting attrition risk</li>
                            <li><span className="text-red-600 font-medium">Red dots</span> indicate high feature values that increase risk</li>
                            <li><span className="text-blue-600 font-medium">Blue dots</span> indicate low feature values that decrease risk</li>
                            <li>Horizontal spread shows the magnitude of impact on predictions</li>
                            <li>Features at the top have the strongest overall impact</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Button onClick={loadSummaryPlot}>Load Overview</Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="feature_importance" className="min-h-[500px]">
              {plotType === "feature_importance" && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {loadingFeatureImportance ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <p className="text-sm text-gray-600">Loading key factors...</p>
                    </div>
                  ) : featureImportancePlot ? (
                    <div className="w-full space-y-4">
                      <div className="bg-white rounded-lg border p-4">
                        <img
                          src={`data:image/png;base64,${featureImportancePlot.image}`}
                          alt="Feature Importance Plot"
                          className="w-full h-auto"
                        />
                      </div>

                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                          <p className="font-medium mb-2">How to read this plot:</p>
                          <ul className="space-y-1 list-disc list-inside text-xs">
                            <li>Features are ranked by their average impact on attrition predictions</li>
                            <li>Longer bars indicate features with stronger influence on risk</li>
                            <li>The top features are the most critical drivers of attrition</li>
                            <li>Values represent mean absolute SHAP values across all employees</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Button onClick={loadFeatureImportance}>Load Key Factors</Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dependence" className="min-h-[500px]">
              {plotType === "dependence" && (
                <>
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Select Feature</label>
                    <Select value={feature} onValueChange={setFeature}>
                      <SelectTrigger className="w-full max-w-md">
                        <span className="text-sm">
                          {feature ? (featureDisplayNames[feature] || feature) : "Select feature"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {features.map((f) => (
                          <SelectItem key={f} value={f}>
                            {featureDisplayNames[f] || f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full flex items-center justify-center p-4">
                    {loadingDependence ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <p className="text-sm text-gray-600">Loading factor relationships for {featureDisplayNames[feature] || feature}...</p>
                      </div>
                    ) : dependencePlot ? (
                      <div className="w-full space-y-4">
                        <div className="bg-white rounded-lg border p-4">
                          <img
                            src={`data:image/png;base64,${dependencePlot.image}`}
                            alt={`Dependence Plot for ${featureDisplayNames[feature] || feature}`}
                            className="w-full h-auto"
                          />
                        </div>

                        <Alert className="border-blue-200 bg-blue-50">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-800">
                            <p className="font-medium mb-2">How to read this plot:</p>
                            <ul className="space-y-1 list-disc list-inside text-xs">
                              <li>X-axis shows the actual values of {featureDisplayNames[feature] || feature}</li>
                              <li>Y-axis shows the impact on attrition risk (SHAP value)</li>
                              <li><span className="text-red-600 font-medium">Red/warm colors</span> indicate high values of the interaction feature</li>
                              <li><span className="text-blue-600 font-medium">Blue/cool colors</span> indicate low values of the interaction feature</li>
                              <li>Vertical spread reveals how this feature interacts with others</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <p className="text-gray-500">Select a feature to view how it relates to other factors</p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {employeeId && employeeData && (
              <>
                <TabsContent value="force" className="min-h-[500px]">
                  {plotType === "force" && (
                    <div className="w-full h-full p-4">
                      {loadingForce ? (
                        <div className="flex flex-col items-center gap-4 justify-center min-h-[400px]">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                          <p className="text-sm text-gray-600">Loading individual impact...</p>
                        </div>
                      ) : forcePlot ? (
                        <div className="w-full space-y-4">
                          {predictionData && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-1">Base Value</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                      {(predictionData.base_value * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Company Average</p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-purple-200 bg-purple-50">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-1">Prediction</p>
                                    <p className="text-2xl font-bold text-purple-700">
                                      {(predictionData.prediction * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Individual Risk</p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className={`border-2 ${
                                predictionData.prediction >= 0.7 ? 'border-red-300 bg-red-50' :
                                predictionData.prediction >= 0.4 ? 'border-yellow-300 bg-yellow-50' :
                                'border-green-300 bg-green-50'
                              }`}>
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-1">Risk Level</p>
                                    <p className={`text-2xl font-bold ${
                                      predictionData.prediction >= 0.7 ? 'text-red-700' :
                                      predictionData.prediction >= 0.4 ? 'text-yellow-700' :
                                      'text-green-700'
                                    }`}>
                                      {predictionData.prediction >= 0.7 ? 'High' :
                                       predictionData.prediction >= 0.4 ? 'Medium' : 'Low'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {predictionData.prediction >= 0.7 ? 'Immediate Action' :
                                       predictionData.prediction >= 0.4 ? 'Monitor Closely' : 'Stable'}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {/* View Employee Profile Button */}
                          {employeeId && (
                            <div className="flex justify-center mb-4">
                              <Link to={`/employees/${employeeId}`}>
                                <Button variant="outline" size="default" className="gap-2">
                                  <User className="h-4 w-4" />
                                  View Employee Profile
                                </Button>
                              </Link>
                            </div>
                          )}

                          <div className="bg-white rounded-lg border p-4">
                            <img
                              src={`data:image/png;base64,${forcePlot.image}`}
                              alt="Force Plot"
                              className="w-full h-auto"
                            />
                          </div>

                          <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-800">
                              <p className="font-medium mb-2">How to read this plot:</p>
                              <ul className="space-y-1 list-disc list-inside text-xs">
                                <li>The plot shows how individual features push the prediction higher or lower</li>
                                <li><span className="text-red-600 font-medium">Red bars</span> push the prediction toward higher attrition risk</li>
                                <li><span className="text-blue-600 font-medium">Blue bars</span> push the prediction toward lower attrition risk</li>
                                <li>Longer bars indicate stronger influence on the final prediction</li>
                                <li>The base value represents the average prediction across all employees</li>
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                          <p>Enter an employee ID to view individual impact analysis</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="waterfall" className="min-h-[500px]">
                  {plotType === "waterfall" && (
                    <div className="w-full h-full p-4">
                      {loadingWaterfall ? (
                        <div className="flex flex-col items-center gap-4 justify-center min-h-[400px]">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                          <p className="text-sm text-gray-600">Loading cumulative impact...</p>
                        </div>
                      ) : waterfallPlot ? (
                        <div className="w-full space-y-4">
                          <div className="bg-white rounded-lg border p-4">
                            <img
                              src={`data:image/png;base64,${waterfallPlot.image}`}
                              alt="Waterfall Plot"
                              className="w-full h-auto"
                            />
                          </div>

                          <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-800">
                              <p className="font-medium mb-2">How to read this plot:</p>
                              <ul className="space-y-1 list-disc list-inside text-xs">
                                <li>Shows the cumulative effect of features on the prediction</li>
                                <li>Starts from the base value (company average) at the bottom</li>
                                <li><span className="text-red-600 font-medium">Red bars</span> increase attrition risk</li>
                                <li><span className="text-blue-600 font-medium">Blue bars</span> decrease attrition risk</li>
                                <li>The final value at the top is the individual's predicted risk</li>
                                <li>Each step shows how one feature changes the prediction</li>
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                          <p>Enter an employee ID to view cumulative impact analysis</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
