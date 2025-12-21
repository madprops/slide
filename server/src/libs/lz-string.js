const m = function() {
  const v = String.fromCharCode, x = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", S = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$", y = {};
  function M(o, e) {
    if (!y[o]) {
      y[o] = {};
      for (let s = 0; s < o.length; s++)
        y[o][o.charAt(s)] = s;
    }
    return y[o][e];
  }
  const d = {
    compressToBase64: function(o) {
      if (o == null)
        return "";
      const e = d._compress(o, 6, function(s) {
        return x.charAt(s);
      });
      switch (e.length % 4) {
        default:
        case 0:
          return e;
        case 1:
          return e + "===";
        case 2:
          return e + "==";
        case 3:
          return e + "=";
      }
    },
    decompressFromBase64: function(o) {
      return o == null ? "" : o == "" ? null : d._decompress(o.length, 32, function(e) {
        return M(x, o.charAt(e));
      });
    },
    compressToUTF16: function(o) {
      return o == null ? "" : d._compress(o, 15, function(e) {
        return v(e + 32);
      }) + " ";
    },
    decompressFromUTF16: function(o) {
      return o == null ? "" : o == "" ? null : d._decompress(o.length, 16384, function(e) {
        return o.charCodeAt(e) - 32;
      });
    },
    //compress into uint8array (UCS-2 big endian format)
    compressToUint8Array: function(o) {
      const e = d.compress(o), s = new Uint8Array(e.length * 2);
      for (let t = 0, c = e.length; t < c; t++) {
        const h = e.charCodeAt(t);
        s[t * 2] = h >>> 8, s[t * 2 + 1] = h % 256;
      }
      return s;
    },
    //decompress from uint8array (UCS-2 big endian format)
    decompressFromUint8Array: function(o) {
      if (o == null)
        return d.decompress(o);
      {
        const e = new Array(o.length / 2);
        for (let t = 0, c = e.length; t < c; t++)
          e[t] = o[t * 2] * 256 + o[t * 2 + 1];
        const s = [];
        return e.forEach(function(t) {
          s.push(v(t));
        }), d.decompress(s.join(""));
      }
    },
    //compress into a string that is already URI encoded
    compressToEncodedURIComponent: function(o) {
      return o == null ? "" : d._compress(o, 6, function(e) {
        return S.charAt(e);
      });
    },
    //decompress from an output of compressToEncodedURIComponent
    decompressFromEncodedURIComponent: function(o) {
      return o == null ? "" : o == "" ? null : (o = o.replace(/ /g, "+"), d._decompress(o.length, 32, function(e) {
        return M(S, o.charAt(e));
      }));
    },
    compress: function(o) {
      return d._compress(o, 16, function(e) {
        return v(e);
      });
    },
    _compress: function(o, e, s) {
      if (o == null)
        return "";
      let t, c;
      const h = {}, _ = {};
      let w = "", A = "", u = "", a = 2, p = 3, l = 2;
      const f = [];
      let n = 0, r = 0, i;
      for (i = 0; i < o.length; i += 1)
        if (w = o.charAt(i), Object.prototype.hasOwnProperty.call(h, w) || (h[w] = p++, _[w] = !0), A = u + w, Object.prototype.hasOwnProperty.call(h, A))
          u = A;
        else {
          if (Object.prototype.hasOwnProperty.call(_, u)) {
            if (u.charCodeAt(0) < 256) {
              for (t = 0; t < l; t++)
                n = n << 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++;
              for (c = u.charCodeAt(0), t = 0; t < 8; t++)
                n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
            } else {
              for (c = 1, t = 0; t < l; t++)
                n = n << 1 | c, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = 0;
              for (c = u.charCodeAt(0), t = 0; t < 16; t++)
                n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
            }
            a--, a == 0 && (a = Math.pow(2, l), l++), delete _[u];
          } else
            for (c = h[u], t = 0; t < l; t++)
              n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
          a--, a == 0 && (a = Math.pow(2, l), l++), h[A] = p++, u = String(w);
        }
      if (u !== "") {
        if (Object.prototype.hasOwnProperty.call(_, u)) {
          if (u.charCodeAt(0) < 256) {
            for (t = 0; t < l; t++)
              n = n << 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++;
            for (c = u.charCodeAt(0), t = 0; t < 8; t++)
              n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
          } else {
            for (c = 1, t = 0; t < l; t++)
              n = n << 1 | c, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = 0;
            for (c = u.charCodeAt(0), t = 0; t < 16; t++)
              n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
          }
          a--, a == 0 && (a = Math.pow(2, l), l++), delete _[u];
        } else
          for (c = h[u], t = 0; t < l; t++)
            n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
        a--, a == 0 && (a = Math.pow(2, l), l++);
      }
      for (c = 2, t = 0; t < l; t++)
        n = n << 1 | c & 1, r == e - 1 ? (r = 0, f.push(s(n)), n = 0) : r++, c = c >> 1;
      for (; ; )
        if (n = n << 1, r == e - 1) {
          f.push(s(n));
          break;
        } else
          r++;
      return f.join("");
    },
    decompress: function(o) {
      return o == null ? "" : o == "" ? null : d._decompress(o.length, 32768, function(e) {
        return o.charCodeAt(e);
      });
    },
    _decompress: function(o, e, s) {
      const t = [];
      let c = 4, h = 4, _ = 3, w = "";
      const A = [];
      let u, a, p, l, f, n, r;
      const i = {
        val: s(0),
        position: e,
        index: 1
      };
      for (u = 0; u < 3; u += 1)
        t[u] = String(u);
      for (p = 0, f = Math.pow(2, 2), n = 1; n != f; )
        l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
      switch (p) {
        case 0:
          for (p = 0, f = Math.pow(2, 8), n = 1; n != f; )
            l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
          r = v(p);
          break;
        case 1:
          for (p = 0, f = Math.pow(2, 16), n = 1; n != f; )
            l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
          r = v(p);
          break;
        case 2:
          return "";
      }
      for (t[3] = String(r), a = String(r), A.push(String(r)); ; ) {
        if (i.index > o)
          return "";
        for (p = 0, f = Math.pow(2, _), n = 1; n != f; )
          l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
        switch (r = p) {
          case 0:
            for (p = 0, f = Math.pow(2, 8), n = 1; n != f; )
              l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
            t[h++] = v(p), r = h - 1, c--;
            break;
          case 1:
            for (p = 0, f = Math.pow(2, 16), n = 1; n != f; )
              l = i.val & i.position, i.position >>= 1, i.position == 0 && (i.position = e, i.val = s(i.index++)), p |= (l > 0 ? 1 : 0) * n, n <<= 1;
            t[h++] = v(p), r = h - 1, c--;
            break;
          case 2:
            return A.join("");
        }
        if (c == 0 && (c = Math.pow(2, _), _++), t[r])
          w = String(t[r]);
        else if (r === h)
          w = a + a.charAt(0);
        else
          return null;
        A.push(w), t[h++] = a + w.charAt(0), c--, a = w, c == 0 && (c = Math.pow(2, _), _++);
      }
    }
  };
  return d;
}();
export {
  m as LZString
};
