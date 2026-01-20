/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import NextImage from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_IMAGE_DURATION_SEC,
  DEFAULT_VIDEO_DURATION_SEC,
  IAdvertisement,
} from "../config";
import { getFileType } from "@shared/lib/get-file-type";

type ReadyMap = Record<number, boolean>;
type DurationMap = Record<number, number>;
interface AdvertisementFullscreenProps {
  advertisements: IAdvertisement[];
}
export const AdvertisementFullscreen = ({
  advertisements,
}: AdvertisementFullscreenProps) => {
  const ads = useMemo(() => advertisements ?? [], [advertisements]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [readyMap, setReadyMap] = useState<ReadyMap>({});
  const [durationMap, setDurationMap] = useState<DurationMap>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingNextId, setPendingNextId] = useState<number | null>(null);

  const currentAd: IAdvertisement | undefined = useMemo(() => {
    if (!ads.length) return undefined;
    return ads[currentIndex % ads.length];
  }, [ads, currentIndex]);

  const nextIndex = useMemo(() => {
    if (!ads.length) return 0;
    return (currentIndex + 1) % ads.length;
  }, [ads, currentIndex]);

  const nextAd: IAdvertisement | undefined = useMemo(() => {
    if (!ads.length) return undefined;
    return ads[nextIndex];
  }, [ads, nextIndex]);

  // Preload helpers
  const markReady = (id: number) => {
    setReadyMap((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const setDurationIfMissing = (id: number, seconds: number) => {
    setDurationMap((prev) => (prev[id] ? prev : { ...prev, [id]: seconds }));
  };

  const preloadImage = (ad: IAdvertisement) => {
    const img = new window.Image();
    img.src = ad.url;
    img.decoding = "async";
    img.onload = () => {
      const duration = ad.seconds ?? DEFAULT_IMAGE_DURATION_SEC;
      setDurationIfMissing(ad.id, duration);
      markReady(ad.id);
    };
    img.onerror = () => {
      // on error still mark as ready to avoid deadlock
      const duration = ad.seconds ?? DEFAULT_IMAGE_DURATION_SEC;
      setDurationIfMissing(ad.id, duration);
      markReady(ad.id);
    };
  };

  const preloadVideo = (ad: IAdvertisement) => {
    const video = document.createElement("video");
    video.src = ad.url;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const onLoadedMetadata = () => {
      const metaDuration =
        isFinite(video.duration) && video.duration > 0
          ? video.duration
          : DEFAULT_VIDEO_DURATION_SEC;
      const duration = ad.seconds ?? metaDuration;
      setDurationIfMissing(ad.id, duration);
    };
    const onCanPlayThrough = () => {
      markReady(ad.id);
      cleanup();
    };
    const onError = () => {
      const duration = ad.seconds ?? DEFAULT_VIDEO_DURATION_SEC;
      setDurationIfMissing(ad.id, duration);
      markReady(ad.id);
      cleanup();
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplaythrough", onCanPlayThrough);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplaythrough", onCanPlayThrough);
    video.addEventListener("error", onError);
    // kick off network
    video.load();
  };

  const ensurePreload = (ad?: IAdvertisement) => {
    if (!ad) return;
    if (readyMap[ad.id]) return;
    const type = ad.type ?? getFileType(ad.url);
    if (type === "image") preloadImage(ad);
    else preloadVideo(ad);
  };

  // When ads arrive, reset to first and preload a couple ahead
  useEffect(() => {
    if (!ads.length) return;
    setCurrentIndex(0);
    // Preload first two immediately
    ensurePreload(ads[0]);
    ensurePreload(ads[1]);
    // Queue the rest shortly after to avoid blocking
    const id = setTimeout(() => {
      ads.slice(2).forEach((ad) => ensurePreload(ad));
    }, 100);
    return () => clearTimeout(id);
  }, [ads.length]);

  // Always ensure current and next are preloaded
  useEffect(() => {
    ensurePreload(currentAd);
    ensurePreload(nextAd);
  }, [currentAd?.id, nextAd?.id]);

  // Handle advancing slides with precise durations
  useEffect(() => {
    if (!currentAd) return;
    if (!readyMap[currentAd.id]) return; // wait until current is ready

    const durationSec =
      durationMap[currentAd.id] ??
      currentAd.seconds ??
      (currentAd.type === "video"
        ? DEFAULT_VIDEO_DURATION_SEC
        : DEFAULT_IMAGE_DURATION_SEC);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(() => {
      if (!ads.length) return;
      const candidateIndex = (currentIndex + 1) % ads.length;
      const candidateId = ads[candidateIndex].id;
      // If next not ready, wait until it gets ready
      if (readyMap[candidateId]) {
        setCurrentIndex(candidateIndex);
      } else {
        setPendingNextId(candidateId);
      }
    }, Math.max(0, durationSec * 1000));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    currentAd?.id,
    readyMap[currentAd?.id ?? -1],
    durationMap[currentAd?.id ?? -1],
    ads.length,
  ]);

  // If a next slide was pending and is now ready, advance immediately
  useEffect(() => {
    if (pendingNextId == null) return;
    if (!ads.length) return;
    if (readyMap[pendingNextId]) {
      const idx = ads.findIndex((a) => a.id === pendingNextId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
      setPendingNextId(null);
    }
  }, [pendingNextId, readyMap, ads]);

  const isFirstReady = currentAd ? !!readyMap[currentAd.id] : false;

  return (
    <div className="overflow-hidden h-full absolute -z-1 inset-0 bg-black">
      <div className="w-full h-full relative">
        <AnimatePresence initial={false}>
          {currentAd && isFirstReady && (
            <motion.div
              key={currentAd.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentAd.type === "image" ? (
                <NextImage
                  src={currentAd.url}
                  alt="advertisement"
                  width={1920}
                  height={1080}
                  priority
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  key={currentAd.id}
                  src={currentAd.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                  preload="auto"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keep next slide mounted invisibly when ready to ensure instant switch */}
        {nextAd && readyMap[nextAd.id] && (
          <div className="absolute inset-0 opacity-0 pointer-events-none">
            {nextAd.type === "image" ? (
              <NextImage
                src={nextAd.url}
                alt="advertisement-next"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                key={nextAd.id}
                src={nextAd.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                controls={false}
                preload="auto"
              />
            )}
          </div>
        )}

        {/* Initial skeleton while first asset loads */}
        {!isFirstReady && (
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
};
