import { useCallback, useState, TouchEvent, MouseEvent } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { Bar, Line, LinePath } from '@visx/shape';
import { extent, bisector } from 'd3-array';
import { LinearGradient } from '@visx/gradient';
import { GridRows, GridColumns } from '@visx/grid';
import { TooltipWithBounds, useTooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { GlyphCircle } from '@visx/glyph';
import { curveMonotoneX } from '@visx/curve';

interface IData {
  company: string;
  year: number;
  price: number;
}

interface IProps {
  width: number;
  height: number;
  data: IData[];
}

type TooltipData = IData[];

export default function LineChart({ data, width, height }: IProps) {
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<TooltipData>();

  // margins from where to start drawing the chart
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };

  // inner measurements
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // line data
  const data1 = data.filter((elm) => elm.company === 'Microsoft');
  const data2 = data.filter((elm) => elm.company === 'Sony');
  const data3 = data.filter((elm) => elm.company === 'EA');

  const series = [data1, data2, data3];

  // line colors
  const colors = ['#00B67E', '#FFAF37', '#F24000'];

  // accessors
  const getMarketCap = (d: IData): number => d?.price;
  const getDate = (d: IData): number => d.year;
  const getYear = (year: number) => data.filter((elm) => elm.year === year);
  const bisectDate = bisector<IData, number>((d) => d.year).left;

  const formatDate = (year: number) => year.toString();

  //cales
  const dateScale = scaleLinear({
    range: [0, innerWidth],
    domain: extent(data, getDate) as [number, number],
    nice: true,
  });

  const marketCapScale = scaleLinear({
    range: [innerHeight, 0],
    domain: extent(data, getMarketCap) as [number, number],
    nice: true,
  });

  // defining tooltip styles
  const tooltipStyles = {
    ...defaultStyles,
    minWidth: 60,
    backgroundColor: 'rgba(0,0,0,0.9)',
    color: 'white',
  };

  // tooltip handler
  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x - margin.left);
      const index = bisectDate(data, x0, 1);

      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;

      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: getYear(d?.year),
        tooltipLeft: x,
        tooltipTop: marketCapScale(getMarketCap(d)),
      });
    },
    [showTooltip, dateScale, marketCapScale]
  );

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={'#718096'}
          rx={14}
        />
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={marketCapScale}
            width={innerWidth}
            height={innerHeight - margin.top}
            stroke="#EDF2F7"
            strokeOpacity={0.2}
          />
          <GridColumns
            scale={dateScale}
            width={innerWidth}
            height={innerHeight}
            stroke="#EDF2F7"
            strokeOpacity={0.2}
          />
          <LinearGradient
            id="area-gradient"
            from={'#43b284'}
            to={'#43b284'}
            toOpacity={0.1}
          />
          <AxisLeft
            // tickTextFill={'#EDF2F7'}
            stroke={'#EDF2F7'}
            tickStroke={'#EDF2F7'}
            scale={marketCapScale}
            tickLabelProps={() => ({
              fill: '#EDF2F7',
              fontSize: 11,
              textAnchor: 'end',
            })}
          />
          <text
            x="-125"
            y="20"
            transform="rotate(-90)"
            fontSize={12}
            fill="#EDF2F7"
          >
            Market Cap, USD
          </text>
          <AxisBottom
            scale={dateScale}
            stroke={'#EDF2F7'}
            // tickFormat={formatDate}
            tickStroke={'#EDF2F7'}
            // tickTextFill={'#EDF2F7'}
            top={innerHeight}
            tickLabelProps={() => ({
              fill: '#EDF2F7',
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />

          {series.map((sData, i) => (
            <LinePath
              key={i}
              stroke={colors[i]}
              strokeWidth={2}
              data={sData}
              x={(d) => dateScale(getDate(d)) ?? 0}
              y={(d) => marketCapScale(getMarketCap(d)) ?? 0}
              curve={curveMonotoneX}
            />
          ))}

          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft - margin.left, y: 0 }}
                to={{ x: tooltipLeft - margin.left, y: innerHeight }}
                stroke={'#EDF2F7'}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="4,2"
              />
            </g>
          )}

          {tooltipData &&
            tooltipData.map((d, i) => (
              <g key={i}>
                <GlyphCircle
                  left={tooltipLeft - margin.left}
                  top={marketCapScale(d.price) + 2}
                  size={110}
                  fill={colors[i]}
                  stroke={'white'}
                  strokeWidth={2}
                />
              </g>
            ))}

          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            onTouchStart={handleTooltip}
            fill={'transparent'}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
        </Group>
      </svg>

      {/* render a tooltip */}
      {tooltipData ? (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
          className="space-y-3"
        >
          <p className="text-lg uppercase underline">
            Market cap in{' '}
            <span className="font-bold">{tooltipData[0]?.year}</span>
          </p>

          {tooltipData.map((elm, idx) => (
            <div key={idx} className="flex flex-col">
              <p className="font-bold">{elm.company}</p>
              <p>${elm.price}</p>
            </div>
          ))}
        </TooltipWithBounds>
      ) : null}
    </div>
  );
}
