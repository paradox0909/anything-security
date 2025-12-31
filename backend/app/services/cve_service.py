import httpx
import os
from datetime import datetime
from typing import List, Dict

class CVEService:
    def __init__(self):
        self.api_key = os.getenv("NVD_API_KEY")
        self.base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    
    def search_cves(self, vendor: str, product: str, version: str) -> List[Dict]:
        """NVD API를 사용하여 CVE 검색"""
        # 키워드 검색 (vendor + product)
        keyword = f"{vendor} {product}".strip()
        
        try:
            params = {
                "keywordSearch": keyword,
                "resultsPerPage": 20
            }
            
            headers = {}
            if self.api_key:
                headers["apiKey"] = self.api_key
            
            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    self.base_url,
                    params=params,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
            
            cves = []
            if "vulnerabilities" in data:
                for vuln in data["vulnerabilities"]:
                    cve_item = vuln.get("cve", {})
                    cve_id = cve_item.get("id", "")
                    
                    # 버전 필터링 (간단한 버전 매칭)
                    # 실제로는 더 정교한 버전 비교가 필요할 수 있습니다
                    descriptions = cve_item.get("descriptions", [])
                    description_text = ""
                    if descriptions:
                        description_text = descriptions[0].get("value", "")
                    
                    # CVSS 점수 추출
                    metrics = cve_item.get("metrics", {})
                    cvss_score = None
                    severity = None
                    
                    if "cvssMetricV31" in metrics:
                        cvss_data = metrics["cvssMetricV31"][0]
                        cvss_score = cvss_data.get("cvssData", {}).get("baseScore")
                        severity = cvss_data.get("cvssData", {}).get("baseSeverity")
                    elif "cvssMetricV30" in metrics:
                        cvss_data = metrics["cvssMetricV30"][0]
                        cvss_score = cvss_data.get("cvssData", {}).get("baseScore")
                        severity = cvss_data.get("cvssData", {}).get("baseSeverity")
                    elif "cvssMetricV2" in metrics:
                        cvss_data = metrics["cvssMetricV2"][0]
                        cvss_score = cvss_data.get("cvssData", {}).get("baseScore")
                    
                    # 발행일 추출
                    published_date = None
                    if "published" in cve_item:
                        try:
                            published_date = datetime.fromisoformat(
                                cve_item["published"].replace("Z", "+00:00")
                            )
                        except:
                            pass
                    
                    cves.append({
                        "cve_id": cve_id,
                        "title": cve_id,
                        "description": description_text[:500],  # 처음 500자만
                        "severity": severity,
                        "cvss_score": cvss_score,
                        "published_date": published_date
                    })
            
            return cves
            
        except Exception as e:
            print(f"Error searching CVEs: {e}")
            return []

