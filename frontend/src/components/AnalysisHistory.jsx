import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  RefreshCw,
  ChevronRight,
  Activity
} from "lucide-react";
import api from "../api/apiclient";
import "../styles/AnalysisHistory.css";

const AnalysisHistory = ({ userId, onClose }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [trends, setTrends] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchAnalysisHistory();
    fetchRiskTrends();
  }, [userId]);

  const fetchAnalysisHistory = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/crime-analysis/history/${userId}?page=${pageNum}&limit=10`);
      
      if (response.data.success) {
        if (pageNum === 1) {
          setAnalyses(response.data.analyses);
        } else {
          setAnalyses(prev => [...prev, ...response.data.analyses]);
        }
        setHasMore(response.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to fetch analysis history:", err);
      setError("Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskTrends = async () => {
    try {
      const response = await api.get(`/crime-analysis/trends/${userId}?days=30`);
      if (response.data.success) {
        setTrends(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch risk trends:", err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchAnalysisHistory(page + 1);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low Risk': return '#22c55e';
      case 'Moderate Risk': return '#f59e0b';
      case 'High Risk': return '#ef4444';
      case 'Very High Risk': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'Low Risk': return <Shield size={16} />;
      case 'Moderate Risk': return <AlertTriangle size={16} />;
      case 'High Risk': return <AlertTriangle size={16} />;
      case 'Very High Risk': return <AlertTriangle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return `${Math.floor(diffHours * 60)} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <motion.div
      className="analysis-history-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="analysis-history-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="history-header">
          <div className="header-content">
            <Activity size={24} />
            <div>
              <h2>Crime Analysis History</h2>
              <p>Your safety assessment timeline</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Trends Summary */}
        {trends && (
          <div className="trends-summary">
            <div className="trend-card">
              <TrendingUp size={20} />
              <div>
                <span className="trend-value">{trends.totalAnalyses}</span>
                <span className="trend-label">Total Analyses</span>
              </div>
            </div>
            <div className="trend-card">
              <BarChart3 size={20} />
              <div>
                <span className="trend-value">
                  {trends.trends.length > 0 ? 
                    (trends.trends.reduce((sum, day) => sum + day.avgRiskScore, 0) / trends.trends.length).toFixed(1)
                    : 'N/A'
                  }
                </span>
                <span className="trend-label">Avg Risk Score</span>
              </div>
            </div>
            <div className="trend-card">
              <Calendar size={20} />
              <div>
                <span className="trend-value">{trends.period}</span>
                <span className="trend-label">Period</span>
              </div>
            </div>
          </div>
        )}

        {/* Analysis List */}
        <div className="history-content">
          {loading && analyses.length === 0 ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spinning" />
              <p>Loading your analysis history...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertTriangle size={24} />
              <p>{error}</p>
              <button onClick={() => fetchAnalysisHistory(1)}>Try Again</button>
            </div>
          ) : analyses.length === 0 ? (
            <div className="empty-state">
              <Eye size={48} />
              <h3>No Analysis History</h3>
              <p>Your crime risk analyses will appear here once you start using the safety predictor.</p>
            </div>
          ) : (
            <>
              <div className="analyses-list">
                {analyses.map((analysis, index) => (
                  <motion.div
                    key={analysis._id}
                    className="analysis-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="analysis-main">
                      <div className="analysis-icon" style={{ color: getRiskColor(analysis.riskAssessment.riskLevel) }}>
                        {getRiskIcon(analysis.riskAssessment.riskLevel)}
                      </div>
                      
                      <div className="analysis-info">
                        <div className="analysis-location">
                          <MapPin size={14} />
                          <span>{analysis.location.address?.city || 'Unknown Location'}</span>
                        </div>
                        
                        <div className="analysis-risk">
                          <span 
                            className="risk-level"
                            style={{ color: getRiskColor(analysis.riskAssessment.riskLevel) }}
                          >
                            {analysis.riskAssessment.riskLevel}
                          </span>
                          <span className="risk-score">
                            {analysis.riskAssessment.riskScore}/10
                          </span>
                        </div>
                        
                        <div className="analysis-meta">
                          <Clock size={12} />
                          <span>{formatDate(analysis.analysisTimestamp)}</span>
                          {analysis.crimeData.isHotspot && (
                            <span className="hotspot-badge">Hotspot</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="analysis-arrow" />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="load-more-section">
                  <button 
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Analysis Detail Modal */}
        <AnimatePresence>
          {selectedAnalysis && (
            <motion.div
              className="analysis-detail-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
            >
              <motion.div
                className="analysis-detail-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="detail-header">
                  <h3>Analysis Details</h3>
                  <button onClick={() => setSelectedAnalysis(null)}>×</button>
                </div>
                
                <div className="detail-content">
                  <div className="detail-section">
                    <h4>Risk Assessment</h4>
                    <div className="risk-details">
                      <div className="risk-item">
                        <span>Risk Level:</span>
                        <span style={{ color: getRiskColor(selectedAnalysis.riskAssessment.riskLevel) }}>
                          {selectedAnalysis.riskAssessment.riskLevel}
                        </span>
                      </div>
                      <div className="risk-item">
                        <span>Safety Score:</span>
                        <span>{selectedAnalysis.riskAssessment.riskScore}/10</span>
                      </div>
                      <div className="risk-item">
                        <span>Confidence:</span>
                        <span>{Math.round(selectedAnalysis.riskAssessment.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Location</h4>
                    <p>{selectedAnalysis.location.address?.formatted || 'Location details unavailable'}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Crime Data</h4>
                    <div className="crime-details">
                      <div className="crime-item">
                        <span>Crimes Found:</span>
                        <span>{selectedAnalysis.crimeData.totalCrimesFound}</span>
                      </div>
                      <div className="crime-item">
                        <span>Crime Rate:</span>
                        <span>{selectedAnalysis.crimeData.crimeRate}</span>
                      </div>
                      {selectedAnalysis.crimeData.mostCommonCrime !== 'Unknown' && (
                        <div className="crime-item">
                          <span>Most Common:</span>
                          <span>{selectedAnalysis.crimeData.mostCommonCrime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Recommendations</h4>
                    <ul className="recommendations-list">
                      {selectedAnalysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisHistory;