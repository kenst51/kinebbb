// ==========================================================================
// VALUATION REDESIGN - STEP 1: HEADER & AI EXECUTIVE SUMMARY ENGINE
// ==========================================================================

window.ValuationRedesign = {
    fmt: function(num) {
        if (!num || isNaN(num)) return '0';
        return new Intl.NumberFormat('vi-VN').format(Math.round(num));
    },

    updateHeaderAndBanner: function(symbol, stats, reports, cmp) {
        symbol = (symbol || '').toUpperCase();
        
        // 1. Resolve Company Name
        let companyName = '';
        try {
            const sisName = document.getElementById('sisName') ? document.getElementById('sisName').innerText.trim() : '';
            const sisSym = document.getElementById('sisSymbol') ? document.getElementById('sisSymbol').innerText.trim() : '';
            if (sisSym === symbol && sisName && sisName !== symbol) {
                companyName = sisName;
            } else if (window.stockToIcbMap && window.stockToIcbMap[symbol]) {
                companyName = window.stockToIcbMap[symbol].companyName || '';
            }
        } catch (e) {}

        const cmpEl = document.getElementById('valModalCmpText');
        const compEl = document.getElementById('valModalCompanyName');
        const badgeEl = document.getElementById('valModalSymbolBadge');
        
        if (badgeEl) badgeEl.textContent = symbol;
        if (compEl) compEl.textContent = companyName ? ('• ' + companyName) : '';
        if (cmpEl) cmpEl.textContent = (cmp > 0 ? this.fmt(cmp) : (stats && stats.latest_price ? this.fmt(stats.latest_price) : '-')) + ' ₫';

        // 2. Compute Valuation Multiples & Status
        const pe = (stats && stats.latest_pe) ? stats.latest_pe : 0;
        const pb = (stats && stats.latest_pb) ? stats.latest_pb : 0;
        const peMean = (stats && stats.pe_mean) ? stats.pe_mean : 15;
        const peStd = (stats && stats.pe_std) ? stats.pe_std : 3;
        const pePct = (stats && stats.pe_percentile !== undefined) ? stats.pe_percentile : 50;
        const indPe = (stats && stats.industry_pe) ? stats.industry_pe : 14.2;
        const indName = (stats && stats.industry_name) ? stats.industry_name : 'Ngành chung';

        const cheaperThanPct = Math.max(5, Math.min(98, 100 - pePct));
        let peDiffVsIndustry = indPe > 0 ? ((indPe - pe) / indPe * 100) : 0;

        let statusText = 'Hợp Lý';
        let tagClass = 'tag-fair';
        let tagTitle = 'ĐỊNH GIÁ HỢP LÝ';

        if (pe > 0 && pe < (peMean - 0.8 * peStd)) {
            statusText = 'Siêu Rẻ';
            tagClass = 'tag-super-cheap';
            tagTitle = 'CƠ HỘI ĐỊNH GIÁ SIÊU RẺ';
        } else if (pe > 0 && pe < peMean) {
            statusText = 'Hấp Dẫn';
            tagClass = 'tag-cheap';
            tagTitle = 'VÙNG ĐỊNH GIÁ HẤP DẪN';
        } else if (pe > (peMean + 1.0 * peStd)) {
            statusText = 'Định Giá Cao';
            tagClass = 'tag-expensive';
            tagTitle = 'ĐỊNH GIÁ CAO / CẦN THẬN TRỌNG';
        }

        // Update Tag
        const tagEl = document.getElementById('valExpertTag');
        if (tagEl) {
            tagEl.className = 'val-expert-tag ' + tagClass;
            tagEl.textContent = tagTitle;
        }

        // Bullet 1: Trạng thái
        const bulletStatus = document.getElementById('valBulletStatus');
        if (bulletStatus) {
            let indCompareText = peDiffVsIndustry > 0 
                ? ('rẻ hơn <b>' + peDiffVsIndustry.toFixed(0) + '%</b> so với trung bình ngành ' + indName)
                : ('cao hơn <b>' + Math.abs(peDiffVsIndustry).toFixed(0) + '%</b> so với trung bình ngành ' + indName);

            bulletStatus.innerHTML = '<b>Trạng thái:</b> ' + symbol + ' đang ở vùng <b>Định giá ' + statusText + '</b> (P/E <b>' + pe + 'x</b>, P/B <b>' + pb + 'x</b> — rẻ hơn <b>' + cheaperThanPct.toFixed(0) + '%</b> lịch sử 3 năm và ' + indCompareText + ').';
        }

        // 3. Process Consensus Reports
        let validTargets = [];
        let buyCount = 0;
        let totalCount = 0;

        if (Array.isArray(reports) && reports.length > 0) {
            for (let i = 0; i < reports.length; i++) {
                const r = reports[i];
                let tpStr = r.targetPriceStr || r.targetPrice || '';
                let title = r.title || '';
                let num = 0;
                if (tpStr && tpStr !== '---') {
                    num = parseFloat(String(tpStr).replace(/\./g, '').replace(/,/g, ''));
                }
                if (!num) {
                    const match = title.match(/(?:gi[aá]\s*MT|gi[aá]\s*m[uụ]c\s*ti[eê]u|target\s*price|gi[aá]\s*k[yỳ]\s*v[oọ]ng)[:\s]*([0-9.,]+)/i);
                    if (match) {
                        num = parseFloat(match[1].replace(/\./g, '').replace(/,/g, ''));
                    }
                }
                if (num && num > 1000) {
                    validTargets.push(num);
                    totalCount++;
                    let rec = (r.recommendation || '').toUpperCase();
                    let tUpper = title.toUpperCase();
                    if (rec.includes('MUA') || rec.includes('KHẢ QUAN') || rec.includes('TÍCH LŨY') || rec.includes('BUY') ||
                        tUpper.includes('MUA') || tUpper.includes('KHẢ QUAN') || tUpper.includes('TÍCH LŨY') || tUpper.includes('OUTPERFORM')) {
                        buyCount++;
                    }
                }
            }
        }

        validTargets.sort(function(a, b) { return a - b; });
        let medianTp = cmp;
        let minTp = cmp;
        if (validTargets.length > 0) {
            minTp = validTargets[0];
            if (validTargets.length % 2 === 0) {
                medianTp = (validTargets[validTargets.length/2 - 1] + validTargets[validTargets.length/2]) / 2;
            } else {
                medianTp = validTargets[Math.floor(validTargets.length/2)];
            }
        }

        let buyRatio = totalCount > 0 ? (buyCount / totalCount * 100) : 100;
        let medianUpside = (cmp > 0 && medianTp > 0) ? ((medianTp - cmp) / cmp * 100) : 0;
        let marginOfSafety = (cmp > 0 && minTp > 0) ? ((minTp - cmp) / cmp * 100) : 0;

        // Bullet 2: Đồng thuận
        const bulletConsensus = document.getElementById('valBulletConsensus');
        if (bulletConsensus) {
            if (totalCount > 0) {
                bulletConsensus.innerHTML = '<b>Đồng thuận:</b> <b>' + buyRatio.toFixed(0) + '%</b> CTCK khuyến nghị <b>MUA</b> với giá mục tiêu trung vị là <b style="color: #40c4ff;">' + this.fmt(medianTp) + ' ₫</b> (Kỳ vọng tăng <b style="color: #00e676;">+' + medianUpside.toFixed(1) + '%</b>).';
            } else {
                bulletConsensus.innerHTML = '<b>Đồng thuận:</b> Đang tổng hợp các báo cáo định giá cập nhật mới nhất từ các CTCK lớn.';
            }
        }

        // Bullet 3: Biên an toàn
        const bulletSafety = document.getElementById('valBulletSafety');
        if (bulletSafety) {
            if (marginOfSafety > 0 && cmp > 0) {
                bulletSafety.innerHTML = '<b>Biên an toàn:</b> Giá hiện tại (' + (cmp/1000).toFixed(1) + 'k) thấp hơn cả dự báo thận trọng nhất (' + (minTp/1000).toFixed(1) + 'k), đem lại <b>Biên an toàn lớn <span style="color: #00e676;">+' + marginOfSafety.toFixed(1) + '%</span></b> cho vị thế tích lũy trung dài hạn.';
            } else if (medianUpside > 15) {
                bulletSafety.innerHTML = '<b>Biên an toàn:</b> Dư địa tăng trưởng so với giá mục tiêu trung vị còn <b><span style="color: #00e676;">+' + medianUpside.toFixed(1) + '%</span></b>, tạo mức đệm an toàn vững chắc cho điểm mua.';
            } else {
                bulletSafety.innerHTML = '<b>Biên an toàn:</b> Mức định giá hiện tại phản ánh sát giá trị hợp lý, nên ưu tiên quản trị rủi ro và giải ngân từng phần.';
            }
        }

        // Update Tab 2 count badge
        const countBadge = document.getElementById('valConsensusCountBadge');
        if (countBadge) {
            countBadge.textContent = totalCount > 0 ? ('(' + totalCount + ' Báo Cáo)') : '';
        }

        // Render Tier 1 & Tier 2
        this.renderTier1(stats);
        this.renderTier2(stats, cmp > 0 ? cmp : (stats ? stats.latest_price : 0));
    },

    renderTier1: function(stats) {
        if (!stats) return;
        const pe = (stats && stats.latest_pe) ? stats.latest_pe : 0;
        const pb = (stats && stats.latest_pb) ? stats.latest_pb : 0;
        const peMean = (stats && stats.pe_mean) ? stats.pe_mean : 15;
        const peStd = (stats && stats.pe_std) ? stats.pe_std : 3;
        const indPe = (stats && stats.industry_pe) ? stats.industry_pe : 14.2;
        const indPb = (stats && stats.industry_pb) ? stats.industry_pb : 1.65;
        const indName = (stats && stats.industry_name) ? stats.industry_name : 'Ngành chung';

        // 1. Gauge Marker Position
        const minPeScale = Math.max(1, peMean - 2.2 * peStd);
        const maxPeScale = peMean + 2.2 * peStd;
        const range = maxPeScale - minPeScale;
        let markerPos = 50;
        if (range > 0) {
            markerPos = Math.max(3, Math.min(97, ((pe - minPeScale) / range) * 100));
        }

        const markerEl = document.getElementById('valGaugeMarker');
        if (markerEl) markerEl.style.left = markerPos + '%';

        // Gauge Badge & Stats
        let zoneText = 'HỢP LÝ';
        let zoneClass = 'tag-fair';
        if (pe > 0 && pe < (peMean - 0.8 * peStd)) {
            zoneText = '🟢 VÙNG SIÊU RẺ (P/E ' + pe + 'x)';
            zoneClass = 'tag-super-cheap';
        } else if (pe > 0 && pe < peMean) {
            zoneText = '🟢 VÙNG HẤP DẪN (P/E ' + pe + 'x)';
            zoneClass = 'tag-cheap';
        } else if (pe > (peMean + 1.0 * peStd)) {
            zoneText = '🔴 ĐỊNH GIÁ CAO (P/E ' + pe + 'x)';
            zoneClass = 'tag-expensive';
        } else {
            zoneText = '🟡 VÙNG HỢP LÝ (P/E ' + pe + 'x)';
            zoneClass = 'tag-fair';
        }

        const zoneBadge = document.getElementById('valGaugeZoneBadge');
        if (zoneBadge) {
            zoneBadge.className = 'val-expert-tag ' + zoneClass;
            zoneBadge.textContent = zoneText;
        }

        const peCurEl = document.getElementById('valGaugePeCur');
        const peMeanEl = document.getElementById('valGaugePeMean');
        const peStdEl = document.getElementById('valGaugePeStd');
        if (peCurEl) peCurEl.textContent = pe + 'x';
        if (peMeanEl) peMeanEl.textContent = peMean + 'x';
        if (peStdEl) {
            const stdDiff = peStd > 0 ? ((pe - peMean) / peStd).toFixed(2) : '0';
            peStdEl.textContent = (stdDiff > 0 ? '+' : '') + stdDiff + ' StDv';
            peStdEl.style.color = stdDiff < 0 ? '#00e676' : '#ff9100';
        }

        // 2. Peer Comparison
        const peerNameEl = document.getElementById('valPeerSectorName');
        if (peerNameEl) peerNameEl.textContent = indName;

        const peerPeText = document.getElementById('valPeerPeText');
        const peerPeBar = document.getElementById('valPeerPeBar');
        const peerPeDiff = document.getElementById('valPeerPeDiff');
        if (peerPeText) peerPeText.textContent = pe + 'x vs ' + indPe + 'x (Ngành)';
        if (peerPeBar) {
            const peRatio = indPe > 0 ? Math.min(100, Math.max(10, (pe / indPe) * 100)) : 50;
            peerPeBar.style.width = peRatio + '%';
            peerPeBar.style.background = pe < indPe ? '#00c853' : '#ff9100';
        }
        if (peerPeDiff) {
            const diffPct = indPe > 0 ? ((indPe - pe) / indPe * 100) : 0;
            peerPeDiff.textContent = diffPct > 0 
                ? ('Rẻ hơn ngành ' + diffPct.toFixed(1) + '%')
                : ('Cao hơn ngành ' + Math.abs(diffPct).toFixed(1) + '%');
            peerPeDiff.style.color = diffPct > 0 ? '#00e676' : '#ff9100';
        }

        const peerPbText = document.getElementById('valPeerPbText');
        const peerPbBar = document.getElementById('valPeerPbBar');
        const peerPbDiff = document.getElementById('valPeerPbDiff');
        if (peerPbText) peerPbText.textContent = pb + 'x vs ' + indPb + 'x (Ngành)';
        if (peerPbBar) {
            const pbRatio = indPb > 0 ? Math.min(100, Math.max(10, (pb / indPb) * 100)) : 50;
            peerPbBar.style.width = pbRatio + '%';
            peerPbBar.style.background = pb < indPb ? '#40c4ff' : '#ff9100';
        }
        if (peerPbDiff) {
            const diffPct = indPb > 0 ? ((indPb - pb) / indPb * 100) : 0;
            peerPbDiff.textContent = diffPct > 0 
                ? ('Rẻ hơn ngành ' + diffPct.toFixed(1) + '%')
                : ('Cao hơn ngành ' + Math.abs(diffPct).toFixed(1) + '%');
            peerPbDiff.style.color = diffPct > 0 ? '#40c4ff' : '#ff9100';
        }
    },

    renderTier2: function(stats, cmp) {
        if (!stats) return;
        const eps = (stats && stats.latest_eps) ? stats.latest_eps : 2000;
        const bvps = (stats && stats.latest_bvps) ? stats.latest_bvps : 15000;
        const peMean = (stats && stats.pe_mean) ? stats.pe_mean : 15;
        const peStd = (stats && stats.pe_std) ? stats.pe_std : 3;
        const pbMean = (stats && stats.pb_mean) ? stats.pb_mean : 1.5;

        // Display EPS
        const epsText = document.getElementById('valImpliedEpsText');
        if (epsText) epsText.textContent = this.fmt(eps) + ' ₫';

        // Scenario 1: P/E Mean
        const p1 = eps * peMean;
        const up1 = cmp > 0 ? ((p1 - cmp) / cmp * 100) : 0;
        const s1Sub = document.getElementById('valImpliedScen1Sub');
        const s1Price = document.getElementById('valImpliedScen1Price');
        const s1Upside = document.getElementById('valImpliedScen1Upside');
        if (s1Sub) s1Sub.textContent = 'P/E = ' + peMean + 'x';
        if (s1Price) s1Price.textContent = this.fmt(p1) + ' ₫';
        if (s1Upside) {
            s1Upside.textContent = (up1 > 0 ? '+' : '') + up1.toFixed(1) + '%';
            s1Upside.style.color = up1 > 0 ? '#00e676' : '#ff5252';
        }

        // Scenario 2: Conservative (-1 StDv)
        const peCons = Math.max(3, peMean - peStd);
        const p2 = eps * peCons;
        const up2 = cmp > 0 ? ((p2 - cmp) / cmp * 100) : 0;
        const s2Sub = document.getElementById('valImpliedScen2Sub');
        const s2Price = document.getElementById('valImpliedScen2Price');
        const s2Upside = document.getElementById('valImpliedScen2Upside');
        if (s2Sub) s2Sub.textContent = 'P/E = ' + peCons.toFixed(2) + 'x';
        if (s2Price) s2Price.textContent = this.fmt(p2) + ' ₫';
        if (s2Upside) {
            s2Upside.textContent = (up2 > 0 ? '+' : '') + up2.toFixed(1) + '%';
            s2Upside.style.color = up2 > 0 ? '#40c4ff' : '#ff5252';
        }

        // Scenario 3: P/B Mean
        const p3 = bvps * pbMean;
        const up3 = cmp > 0 ? ((p3 - cmp) / cmp * 100) : 0;
        const s3Sub = document.getElementById('valImpliedScen3Sub');
        const s3Price = document.getElementById('valImpliedScen3Price');
        const s3Upside = document.getElementById('valImpliedScen3Upside');
        if (s3Sub) s3Sub.textContent = 'P/B = ' + pbMean + 'x | BVPS = ' + (bvps/1000).toFixed(1) + 'k';
        if (s3Price) s3Price.textContent = this.fmt(p3) + ' ₫';
        if (s3Upside) {
            s3Upside.textContent = (up3 > 0 ? '+' : '') + up3.toFixed(1) + '%';
            s3Upside.style.color = up3 > 0 ? '#ce93d8' : '#ff5252';
        }

        // Initialize What-If Sliders
        this.currentCmp = cmp;
        const sliderEps = document.getElementById('valSliderEps');
        const sliderPe = document.getElementById('valSliderPe');

        if (sliderEps) {
            const minEps = Math.max(500, Math.round(eps * 0.4 / 100) * 100);
            const maxEps = Math.round(eps * 2.2 / 100) * 100;
            sliderEps.min = minEps;
            sliderEps.max = maxEps;
            sliderEps.step = Math.max(50, Math.round((maxEps - minEps) / 40 / 50) * 50);
            sliderEps.value = Math.round(eps);
        }

        if (sliderPe) {
            const minPe = Math.max(3, Math.floor(peMean - 2.2 * peStd));
            const maxPe = Math.ceil(peMean + 2.2 * peStd);
            sliderPe.min = minPe;
            sliderPe.max = Math.max(maxPe, 25);
            sliderPe.step = 0.5;
            sliderPe.value = ((stats && stats.latest_pe) ? stats.latest_pe : peMean).toFixed(1);
        }

        this.onWhatIfChange();
    },

    onWhatIfChange: function() {
        const sliderEps = document.getElementById('valSliderEps');
        const sliderPe = document.getElementById('valSliderPe');
        const dispEps = document.getElementById('valSliderEpsDisplay');
        const dispPe = document.getElementById('valSliderPeDisplay');
        const resPrice = document.getElementById('valWhatIfTargetPrice');
        const resUpside = document.getElementById('valWhatIfUpsideBadge');

        const eps = sliderEps ? parseFloat(sliderEps.value) : 0;
        const pe = sliderPe ? parseFloat(sliderPe.value) : 0;
        const cmp = this.currentCmp || 0;

        if (dispEps) dispEps.textContent = this.fmt(eps) + ' ₫';
        if (dispPe) dispPe.textContent = pe.toFixed(1) + 'x';

        const targetPrice = eps * pe;
        if (resPrice) resPrice.textContent = this.fmt(targetPrice) + ' ₫';

        if (resUpside && cmp > 0) {
            const up = ((targetPrice - cmp) / cmp * 100);
            resUpside.textContent = (up > 0 ? '+' : '') + up.toFixed(1) + '% so với giá hiện tại';
            resUpside.style.color = up > 0 ? '#00e676' : '#ff5252';
            resUpside.style.borderColor = up > 0 ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 82, 82, 0.35)';
            resUpside.style.background = up > 0 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 82, 82, 0.12)';
        }
    }
};
