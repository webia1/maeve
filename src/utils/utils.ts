import { parse } from 'parse5';

import axios from 'axios';
import { Collection, Song } from '@/@types/model/model';

const getArtworkUrl = (
  originalUrl: string,
  width: number,
  height: number
): string => {
  if (!originalUrl) {
    return '';
  }

  const replace: { [key: string]: number } = {
    '{w}': width,
    '{h}': height
  };

  return originalUrl.replace(/{w}|{h}/gi, matched => {
    return replace[matched].toString();
  });
};

const extractArtworkUrl = (html: string) => {
  const document = parse(html) as Document;
  if (document.childNodes.length < 2) {
    return '';
  }

  const headNode = document.childNodes[1].childNodes[0];

  for (let i = 0; i < headNode.childNodes.length; i++) {
    const child = headNode.childNodes[i];
    // @ts-ignore
    if (child.nodeName !== 'meta' || child.attrs.length < 2) {
      continue;
    }

    // @ts-ignore
    if (child.attrs[0].value === 'og:image:secure_url') {
      // @ts-ignore
      return child.attrs[1].value;
    }
  }
  return '';
};

const formatArtworkUrl = (
  artworkUrl: string,
  width: number,
  height: number
) => {
  if (!artworkUrl || artworkUrl.length === 0) {
    return '';
  }
  return `${artworkUrl.substring(
    0,
    artworkUrl.lastIndexOf('/') + 1
  )}${width}x${height}bb.jpg`;
};

/**
 * A workaround to get the artwork for an artist as Apple Music API doesn't support it yet
 * @param {string} itunesUrl - iTunes URL for an artist
 * @param width (optional) - If not provided, the placeholder url will be returned
 * @param height (optional) - If not provided, the placeholder url will be returned
 * @returns {Promise}
 */
const getArtistArtwork = (
  itunesUrl: string,
  width?: number,
  height?: number
): Promise<string> => {
  return axios
    .get(itunesUrl)
    .then(result => extractArtworkUrl(result.data))
    .then(url => {
      if (!width || !height) {
        return url;
      }
      return formatArtworkUrl(url, width, height);
    })
    .catch(err => {
      return '';
    });
};

const getSongsFromCollection = (collection: Collection): Song[] => {
  if (!collection.relationships || !collection.relationships.tracks) {
    return [];
  }
  return collection.relationships.tracks.data;
};

export {
  getArtworkUrl,
  getArtistArtwork,
  formatArtworkUrl,
  getSongsFromCollection
};
